from typing import List, Dict


def to_text_document(item: Dict) -> Dict:
    """Convert a raw MongoDB item to a text document and metadata.

    Expects item = {"collection": name, "document": {...}}
    """
    coll = item.get("collection")
    doc = item.get("document", {})
    text_parts = []
    metadata = {"collection": coll}

    # Heuristics per collection type based on actual MongoDB schema
    if coll == "products":
        # Product info: name, description, brand, categories, price, rate, details, etc.
        text_parts.append(str(doc.get("name", "")))
        text_parts.append(str(doc.get("description", "")))
        text_parts.append(str(doc.get("details", "")))
        text_parts.append(f"Brand: {doc.get('brand', '')}")
        text_parts.append(f"Category: {doc.get('categories', '')}")
        text_parts.append(f"Price: {doc.get('price', 'N/A')} VND")
        text_parts.append(f"Old Price: {doc.get('oldPrice', 'N/A')} VND")
        text_parts.append(f"Rating: {doc.get('rate', 'N/A')}/5 ({doc.get('rateNumber', 0)} reviews)")
        text_parts.append(f"Status: {doc.get('status', '')}")
        text_parts.append(f"Available Quantity: {doc.get('quantity', 'N/A')}")
        text_parts.append(f"Usage Guide: {doc.get('guide', '')}")
        metadata.update({"id": str(doc.get("_id")), "price": doc.get("price"), "brand": doc.get("brand"), "category": doc.get("categories"), "rate": doc.get("rate"),
    "rateNumber": doc.get("rateNumber"),})
    
    elif coll == "vouchers":
        # Voucher code, discount, conditions, validity period
        text_parts.append(f"Name: {doc.get('name', '')}")
        text_parts.append(f"Code: {doc.get('code', '')}")
        text_parts.append(f"Description: {doc.get('description', '')}")
        text_parts.append(f"Discount: {doc.get('discount', '')}%")
        text_parts.append(f"Max Discount: {doc.get('maxDiscount', 'N/A')} VND")
        text_parts.append(f"Min Order: {doc.get('minOrder', 'N/A')} VND")
        text_parts.append(f"Member Code: {doc.get('memberCode', 'N/A')}")
        text_parts.append(f"Valid from: {doc.get('startDate', 'N/A')} to {doc.get('endDate', 'N/A')}")
        text_parts.append(f"Status: {doc.get('status', '')}")
        metadata.update({"id": str(doc.get("_id")), "discount": doc.get("discount"), "code": doc.get("code")})
    else:
        # Fallback
        text_parts.append(" ".join([f"{k}:{v}" for k, v in doc.items()]))
        metadata.update({"id": str(doc.get("_id"))})

    text = "\n".join([p for p in text_parts if p])

    return {"id": metadata.get("id") or None, "text": text, "metadata": metadata}


def prepare_documents(items: List[Dict]) -> List[Dict]:
    return [to_text_document(it) for it in items]


if __name__ == "__main__":
    # quick smoke test
    sample = {"collection": "products", "document": {"_id": 1, "name": "Foundation", "description": "Liquid foundation", "brand": "Acme", "category": "Face", "price": 29.99}}
    print(to_text_document(sample))