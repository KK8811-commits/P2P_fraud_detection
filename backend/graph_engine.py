import networkx as nx
from typing import Dict, List, Any, Tuple
from collections import defaultdict

class GraphIntelligenceEngine:
    """
    Analyzes two distinct graph topologies:
    1. Identity Linkage Graph (Bipartite): Links users through shared PII
       (Phone, SSN, Device ID, Physical Address) to detect Synthetic Identity Rings.
    2. P2P Transaction Flow Graph (Directed): Analyzes fund flow patterns,
       detecting circular routing (cycles), high in/out degree (mule fan-in/fan-out).
    """

    def __init__(self):
        # Bipartite graph: Nodes are either User IDs or Entity Values (Phone, SSN, Device)
        self.identity_graph = nx.Graph()
        # Directed multi-attribute graph: Nodes are Account IDs, edges are transactions
        self.flow_graph = nx.DiGraph()

    def build_identity_network(self, users: List[Dict[str, Any]], transactions: List[Dict[str, Any]] = None):
        """Builds identity linkage graph from user attributes and device fingerprints."""
        self.identity_graph.clear()

        for u in users:
            uid = u["user_id"]
            self.identity_graph.add_node(uid, node_type="USER", label=u.get("full_name", uid))

            # Shared identifiers
            if u.get("phone_number"):
                phone_node = f"PHONE:{u['phone_number']}"
                self.identity_graph.add_node(phone_node, node_type="PHONE", label=u['phone_number'])
                self.identity_graph.add_edge(uid, phone_node, relationship="HAS_PHONE")

            if u.get("ssn_hash"):
                ssn_node = f"SSN:{u['ssn_hash']}"
                self.identity_graph.add_node(ssn_node, node_type="SSN", label="SSN-HASH")
                self.identity_graph.add_edge(uid, ssn_node, relationship="HAS_SSN")

            if u.get("address"):
                addr_node = f"ADDR:{u['address']}"
                self.identity_graph.add_node(addr_node, node_type="ADDRESS", label=u['address'])
                self.identity_graph.add_edge(uid, addr_node, relationship="HAS_ADDRESS")

        # Also link devices seen in transactions to user accounts
        if transactions:
            for tx in transactions:
                uid = tx.get("user_id") or tx.get("source_user_id")
                device_id = tx.get("device_id")
                if uid and device_id:
                    dev_node = f"DEV:{device_id}"
                    self.identity_graph.add_node(dev_node, node_type="DEVICE", label=device_id)
                    self.identity_graph.add_edge(uid, dev_node, relationship="USED_DEVICE")

    def build_transaction_flow(self, transactions: List[Dict[str, Any]]):
        """Constructs directed money flow graph between accounts."""
        self.flow_graph.clear()

        for tx in transactions:
            src = tx["source_account_id"]
            dst = tx["target_account_id"]
            amt = float(tx.get("amount", 0.0))

            if not self.flow_graph.has_node(src):
                self.flow_graph.add_node(src, node_type="ACCOUNT")
            if not self.flow_graph.has_node(dst):
                self.flow_graph.add_node(dst, node_type="ACCOUNT")

            if self.flow_graph.has_edge(src, dst):
                self.flow_graph[src][dst]["weight"] += amt
                self.flow_graph[src][dst]["count"] += 1
            else:
                self.flow_graph.add_edge(src, dst, weight=amt, count=1)

    def extract_graph_features_for_transaction(self, tx: Dict[str, Any], user_info: Dict[str, Any] = None) -> Dict[str, float]:
        """
        Calculates graph metrics for a specific transaction in real time.
        These numerical features are fed directly into the ML classifier!
        """
        src = tx["source_account_id"]
        dst = tx["target_account_id"]
        uid = user_info.get("user_id") if user_info else None
        dev = tx.get("device_id")

        features = {
            "src_in_degree": 0.0,
            "src_out_degree": 0.0,
            "dst_in_degree": 0.0,
            "dst_out_degree": 0.0,
            "is_part_of_cycle": 0.0,
            "shared_entity_count": 0.0,
            "device_user_sharing_count": 0.0,
            "cluster_size": 1.0,
            "mule_fan_in_ratio": 0.0
        }

        # 1. Flow Graph Degree & Centrality
        if self.flow_graph.has_node(src):
            features["src_in_degree"] = float(self.flow_graph.in_degree(src))
            features["src_out_degree"] = float(self.flow_graph.out_degree(src))

        if self.flow_graph.has_node(dst):
            dst_in = float(self.flow_graph.in_degree(dst))
            dst_out = float(self.flow_graph.out_degree(dst))
            features["dst_in_degree"] = dst_in
            features["dst_out_degree"] = dst_out
            if dst_out > 0:
                features["mule_fan_in_ratio"] = float(dst_in / (dst_out + 1.0))
            else:
                features["mule_fan_in_ratio"] = float(dst_in)

        # 2. Cycle Detection (P2P Circular Routing / Layering)
        if self.flow_graph.has_node(src) and self.flow_graph.has_node(dst):
            # Check if money can flow back from dst to src (a cycle formed by this tx)
            if nx.has_path(self.flow_graph, dst, src):
                features["is_part_of_cycle"] = 1.0

        # 3. Synthetic Identity Ring Signals (Identity Graph Analysis)
        if uid and self.identity_graph.has_node(uid):
            # Look at connected components (cluster of linked entities)
            component = nx.node_connected_component(self.identity_graph, uid)
            features["cluster_size"] = float(len(component))

            # Count other USER nodes connected through 2 hops (User -> PII -> Other User)
            two_hop_neighbors = set()
            for neighbor in self.identity_graph.neighbors(uid):
                for second_neighbor in self.identity_graph.neighbors(neighbor):
                    if second_neighbor != uid and self.identity_graph.nodes[second_neighbor].get("node_type") == "USER":
                        two_hop_neighbors.add(second_neighbor)
            features["shared_entity_count"] = float(len(two_hop_neighbors))

        # 4. Device Fingerprint Sharing
        if dev:
            dev_node = f"DEV:{dev}"
            if self.identity_graph.has_node(dev_node):
                linked_users = [n for n in self.identity_graph.neighbors(dev_node) if self.identity_graph.nodes[n].get("node_type") == "USER"]
                features["device_user_sharing_count"] = float(len(linked_users))

        return features

    def get_subgraph_for_visualization(self, entity_id: str, depth: int = 2) -> Dict[str, Any]:
        """
        Exports an ego-graph around an entity formatted specifically
        for interactive rendering (Vis-Network / Cytoscape) in the frontend.
        """
        nodes = []
        edges = []
        visited = set()

        # Check in both identity and flow graphs
        sub_g = nx.Graph()

        if self.flow_graph.has_node(entity_id):
            flow_ego = nx.ego_graph(self.flow_graph.to_undirected(), entity_id, radius=depth)
            sub_g = nx.compose(sub_g, flow_ego)

        if self.identity_graph.has_node(entity_id):
            id_ego = nx.ego_graph(self.identity_graph, entity_id, radius=depth)
            sub_g = nx.compose(sub_g, id_ego)

        # Fallback if node not found
        if len(sub_g.nodes) == 0:
            return {"nodes": [{"id": entity_id, "label": entity_id, "group": "ACCOUNT"}], "edges": []}

        for n in sub_g.nodes():
            n_data = self.identity_graph.nodes.get(n) or self.flow_graph.nodes.get(n, {})
            node_type = n_data.get("node_type", "ACCOUNT")
            label = n_data.get("label", n)
            nodes.append({
                "id": str(n),
                "label": str(label),
                "group": node_type,
                "title": f"Type: {node_type} | ID: {n}"
            })

        for u, v in sub_g.edges():
            edge_id = f"{u}->{v}"
            if edge_id not in visited:
                visited.add(edge_id)
                # Check relationship or weight
                rel = "CONNECTED"
                if self.flow_graph.has_edge(u, v):
                    w = self.flow_graph[u][v].get("weight", 0)
                    rel = f"${w:.2f}"
                elif self.identity_graph.has_edge(u, v):
                    rel = self.identity_graph[u][v].get("relationship", "SHARED")

                edges.append({
                    "from": str(u),
                    "to": str(v),
                    "label": rel
                })

        return {"nodes": nodes, "edges": edges}
