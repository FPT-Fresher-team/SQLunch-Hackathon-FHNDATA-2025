import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_DB")


def get_client(uri: str = None):
    uri = uri or MONGO_URI
    if not uri:
        raise ValueError("Set MONGO_URI in environment or pass uri param")
    return MongoClient(uri)


def load_collections(client=None, db_name: str = None, collection_names=None):
    """Load specified collections from MongoDB and return list of documents.

    Returns list of dicts containing raw documents and metadata.
    """
    if client is None:
        client = get_client()
    # Try to infer db
    if db_name is None:
        # if user uses a default DB in connection string, you can inspect client.list_database_names or ask user to pass db_name
        raise ValueError("Please provide db_name (e.g. 'bunnyStore_database')")

    db = client[db_name]
    collection_names = collection_names or ["products", "vouchers"]

    items = []
    for cname in collection_names:
        if cname not in db.list_collection_names():
            continue
        coll = db[cname]
        for doc in coll.find():
            items.append({"collection": cname, "document": doc})

    return items


if __name__ == "__main__":
    # quick test (requires MONGO_URI and db name)
    import sys

    if len(sys.argv) < 2:
        print("Usage: python load_from_mongo.py <db_name>")
        raise SystemExit(1)
    client = get_client()
    data = load_collections(client=client, db_name=sys.argv[1])
    print(f"Loaded {len(data)} records")