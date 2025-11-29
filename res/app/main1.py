# NamTh91 -- 1.00 - creation 2025-11-26

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import pandas as pd
import pymongo
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

pd.set_option('display.max_columns', None)
load_dotenv()

app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def keep_alive():
    return {"message": "alive"}


# ========================================================= #
#                 EMBEDDING + SIMILARITY (TFIDF)            #
# ========================================================= #

def build_embedding(df):
    df = df.copy()

    # Gộp text
    def merge_text(row):
        return " ".join([
            str(row.get("name", "")),
            str(row.get("description", "")),
            str(row.get("details", ""))
        ])

    df["text"] = df.apply(merge_text, axis=1)

    # TF-IDF
    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        lowercase=True
    )

    tfidf = vectorizer.fit_transform(df["text"])

    # Similarity: cosine
    sim_matrix = cosine_similarity(tfidf)

    return df, sim_matrix


# ========================================================= #
#              KEYWORD SEARCH (GIỮ NGUYÊN)                  #
# ========================================================= #

def search_keyword_products(df, keyword):
    keyword = keyword.lower()

    def score_row(row):
        score = 0
        fields = ["name", "description", "details", "categories", "skincare", "makeup", "brand"]
        weights = [5, 4, 3, 3, 2, 2, 3]

        for f, w in zip(fields, weights):
            if keyword in str(row.get(f, "")).lower():
                score += w

        return score

    df = df.copy()
    df["kw_score"] = df.apply(score_row, axis=1)
    df = df[df["kw_score"] > 0]

    if len(df) == 0:
        return None

    return df.sort_values("kw_score", ascending=False).iloc[0]["id"]


# ========================================================= #
#            GET PURCHASED PRODUCTS                         #
# ========================================================= #

def get_user_purchased_ids(uid, orders_collection):
    user_orders = orders_collection.find({"customerInfo.userId": uid})
    purchased = []

    for o in user_orders:
        for item in o.get("products", []):
            purchased.append(str(item["id"]))

    return purchased


# ========================================================= #
#             TOP RATED PRODUCTS                            #
# ========================================================= #

def top_rated_products(products, limit=10):
    return sorted(products, key=lambda x: x.get("rate", 0), reverse=True)[:limit]


# ========================================================= #
#            RECOMMEND BY PRODUCT SIMILARITY                #
# ========================================================= #

def recommend_by_product(product_id, products, encoded, sim_matrix, purchased_ids, top_k=10):
    if not product_id:
        return top_rated_products(products)

    product_id = str(product_id)

    if product_id not in encoded["id"].values:
        return top_rated_products(products)

    idx_list = encoded.index[encoded["id"] == product_id].tolist()
    if len(idx_list) == 0:
        return top_rated_products(products)

    idx = idx_list[0]

    sim_scores = sim_matrix[idx]

    encoded_copy = encoded.copy()
    encoded_copy["similarity"] = sim_scores

    similar = encoded_copy[encoded_copy["id"] != product_id]
    similar = similar.sort_values("similarity", ascending=False)

    top_ids = similar["id"].head(top_k).tolist()
    print("top_ids:", top_ids)

    return [p for p in products if p["id"] in top_ids]


# ========================================================= #
#        RECOMMEND BY LAST PURCHASED PRODUCT                #
# ========================================================= #

def recommend_by_purchased_items(purchased_ids, products, encoded, sim_matrix, top_k=10):
    if not purchased_ids:
        return top_rated_products(products)

    last_id = purchased_ids[-1]

    return recommend_by_product(last_id, products, encoded, sim_matrix, purchased_ids, top_k)


# ========================================================= #
#               RECOMMEND BY USER BEHAVIOR                  #
# ========================================================= #

def recommend_by_user(uid, orders_collection, comments_collection, products, encoded, sim_matrix, purchased_ids):
    user_orders = list(orders_collection.find({"customerInfo.userId": uid}))

    # CASE A: User mới → chưa mua gì
    if not user_orders:
        return top_rated_products(products)

    order_ids = [str(o["_id"]) for o in user_orders]
    print("order_user:", order_ids)

    user_comments = list(comments_collection.find({"orderId": {"$in": order_ids}}))
    print("user comment:", user_comments)

    # CASE B: Mua nhưng không rating
    if not user_comments:
        return recommend_by_purchased_items(purchased_ids, products, encoded, sim_matrix)

    # CASE C: Có rating → lấy sản phẩm user rate cao nhất
    best_item = max(user_comments, key=lambda x: x.get("rate", 0))
    product_id = best_item.get("productId")

    if not product_id:
        return top_rated_products(products)

    return recommend_by_product(product_id, products, encoded, sim_matrix, purchased_ids)


# ========================================================= #
#                        MAIN API                           #
# ========================================================= #

@app.post("/recommend")
async def recommend(request: Request):
    try:
        body = await request.json()
        cookies = request.cookies
        uid = cookies.get("uid")
        # uid = body["uid"]
        mode = body["mode"]
        product_id = body.get("productId")
        print(uid,mode)
        

        # DB CONNECT
        url = os.getenv("DATABASE_URL")
        connect = pymongo.MongoClient(url)
        db = connect["bunnyStore_database"]

        products_collection = db["products"]
        comments_collection = db["comments"]
        search_logs = db["search_logs"]
        orders_collection = db["orders"]

        # LOAD PRODUCTS
        products = []
        for p in products_collection.find():
            products.append({
                "_id": str(p["_id"]),
                "brand": p["brand"],
                "categories": p["categories"],
                "subcategories":p["subcategories"],
                "img": p["img"],
                "oldPrice": p["oldPrice"],
                "price": p["price"],
                "name": p["name"],
                "rate": p["rate"],
                "saleNumber": p["saleNumber"],
                "description": p.get("description", ""),
                "details": p.get("details", "")
            })

        df_products = pd.DataFrame(products)
        df_products["id"] = df_products["_id"]
        products_list = df_products.to_dict(orient="records")

        # Build TF-IDF similarity
        encoded, sim_matrix = build_embedding(df_products)

        purchased_ids = get_user_purchased_ids(uid, orders_collection)

        # MODE RUNNING
        if mode == "rating":
            result = recommend_by_user(uid, orders_collection, comments_collection,
                                       products_list, encoded, sim_matrix, purchased_ids)

        elif mode == "product":
            result = recommend_by_product(product_id, products_list, encoded, sim_matrix, purchased_ids)

        elif mode == "keyword":
            logs = list(search_logs.find({"userId": uid}))
            if len(logs) == 0:
                result = []
            else:
                df_kw = pd.DataFrame(logs).sort_values(by="timestamp", ascending=False)
                top_kw = df_kw.iloc[0]["keyword"]

                main_pid = search_keyword_products(df_products, top_kw)
                if main_pid:
                    result = recommend_by_product(main_pid, products_list, encoded, sim_matrix, purchased_ids)
                else:
                    result = []

        else:
            return JSONResponse(content={"message": "Invalid mode"}, status_code=400)

        return JSONResponse(content={"data": result})

    except Exception as e:
        print(e)
        return JSONResponse(content={"message": str(e)}, status_code=500)