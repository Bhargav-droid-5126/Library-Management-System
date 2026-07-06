from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import conn, cursor

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bhargav-library.vercel.app",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Member(BaseModel):
    mem_name: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str
class UserLogin(BaseModel):
    mem_id: int
    password: str
    
class Book(BaseModel):
    title: str
    author: str
    genre: str

class DeleteBook(BaseModel):
    book_id: int

class BorrowBook(BaseModel):
    book_id: int
    mem_id: int

class ReturnBook(BaseModel):
    book_id: int

class UpdateBook(BaseModel):
    book_id: int
    title: str
    author: str
    genre: str

class UpdateProfile(BaseModel):
    mem_id: int
    mem_name: str

@app.get("/")
def home():
    return {"message": "Library Management System"}


@app.post("/register")
def register(member: Member):

    cursor.execute(
        """
        INSERT INTO members(mem_name,password,role)
        VALUES(%s,%s,'user')
        RETURNING mem_id
        """,
        (member.mem_name, member.password)
    )

    member_id = cursor.fetchone()[0]

    conn.commit()

    return {
        "success": True,
        "message": "Registration Successful",
        "member_id": member_id
    }

@app.post("/add-book")
def add_book(book: Book):

    cursor.execute(
        """
        INSERT INTO books(title, author, genre)
        VALUES(%s, %s, %s)
        """,
        (book.title, book.author, book.genre)
    )

    conn.commit()

    return {
        "success": True,
        "message": "Book Added Successfully"
    }

@app.delete("/delete-book")
def delete_book(book: DeleteBook):

    cursor.execute(
        """
        DELETE FROM books
        WHERE book_id=%s
        """,
        (book.book_id,)
    )

    conn.commit()

    return {
        "success": True,
        "message": "Book Deleted Successfully"
    }

@app.put("/update-profile")
def update_profile(user: UpdateProfile):

    cursor.execute("""
        UPDATE members
        SET mem_name=%s
        WHERE mem_id=%s
    """,(user.mem_name, user.mem_id))

    conn.commit()

    return {
        "success": True,
        "message": "Name Updated Successfully"
    }

@app.get("/dashboard-stats")
def dashboard_stats():

    cursor.execute("SELECT COUNT(*) FROM books")
    total_books = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM members")
    total_members = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM books
        WHERE borrowed_by IS NOT NULL
    """)
    borrowed_books = cursor.fetchone()[0]

    return {

        "books": total_books,

        "members": total_members,

        "borrowed": borrowed_books

    }

@app.get("/books")
def get_books():

    cursor.execute("""
        SELECT * FROM books
    """)

    books = cursor.fetchall()

    book_list = []

    for book in books:

        book_list.append({
            "book_id": book[0],
            "title": book[1],
            "author": book[2],
            "genre": book[3],
            "borrowed_by": book[4]
        })

    return book_list

@app.put("/update-book")
def update_book(book: UpdateBook):

    cursor.execute("""
        UPDATE books
        SET title=%s,
            author=%s,
            genre=%s
        WHERE book_id=%s
    """,(
        book.title,
        book.author,
        book.genre,
        book.book_id
    ))

    conn.commit()

    return {
        "success": True,
        "message": "Book Updated Successfully"
    }

@app.get("/members")
def get_members():

    cursor.execute("""
        SELECT mem_id, mem_name, role
        FROM members
    """)

    members = cursor.fetchall()

    return members

    

@app.put("/borrow-book")
def borrow_book(book: BorrowBook):

    cursor.execute(
        """
        SELECT borrowed_by
        FROM books
        WHERE book_id=%s
        """,
        (book.book_id,)
    )

    result = cursor.fetchone()

    if result is None:
        return {
            "success": False,
            "message": "Book Not Found"
        }

    if result[0] is not None:
        return {
            "success": False,
            "message": "Book Already Borrowed"
        }

    cursor.execute(
        """
        UPDATE books
        SET borrowed_by=%s
        WHERE book_id=%s
        """,
        (book.mem_id, book.book_id)
    )

    conn.commit()

    return {
        "success": True,
        "message": "Book Borrowed Successfully"
    }

    

@app.post("/user-login")
def user_login(user: UserLogin):

    cursor.execute(
        """
        SELECT mem_id, mem_name
        FROM members
        WHERE mem_id=%s
        AND password=%s
        AND role='user'
        """,
        (user.mem_id, user.password)
    )

    member = cursor.fetchone()

    if member:

        return {
            "success": True,
            "message": "Login Successful",
            "member_id": member[0],
            "name": member[1]
        }

    return {
        "success": False,
        "message": "Invalid Member ID or Password"
    }

@app.get("/my-books/{mem_id}")
def my_books(mem_id: int):

    cursor.execute("""
        SELECT *
        FROM books
        WHERE borrowed_by=%s
    """,(mem_id,))

    books = cursor.fetchall()

    book_list = []

    for book in books:

        book_list.append({

            "book_id": book[0],
            "title": book[1],
            "author": book[2],
            "genre": book[3],
            "borrowed_by": book[4]

        })

    return book_list

@app.put("/return-book")
def return_book(book: ReturnBook):

    cursor.execute("""
        UPDATE books
        SET borrowed_by=NULL
        WHERE book_id=%s
    """,(book.book_id,))

    conn.commit()

    return {

        "success": True,
        "message": "Book Returned Successfully"

    }

@app.get("/search/{title}")
def search_book(title: str):

    cursor.execute("""
        SELECT *
        FROM books
        WHERE LOWER(title) LIKE LOWER(%s)
    """, ('%' + title + '%',))

    books = cursor.fetchall()

    book_list = []

    for book in books:

        book_list.append({

            "book_id": book[0],
            "title": book[1],
            "author": book[2],
            "genre": book[3],
            "borrowed_by": book[4]

        })

    return book_list

@app.get("/recommend/{genre}/{book_id}")
def recommend_books(genre: str, book_id: int):

    cursor.execute("""
        SELECT *
        FROM books
        WHERE genre=%s
        AND book_id!=%s
        LIMIT 5
    """,(genre,book_id))

    books = cursor.fetchall()

    recommendations = []

    for book in books:

        recommendations.append({

            "book_id": book[0],
            "title": book[1],
            "author": book[2],
            "genre": book[3]

        })

    return recommendations

@app.get("/profile/{mem_id}")
def profile(mem_id: int):

    cursor.execute("""
        SELECT mem_id, mem_name
        FROM members
        WHERE mem_id=%s
    """,(mem_id,))

    member = cursor.fetchone()

    cursor.execute("""
        SELECT COUNT(*)
        FROM books
        WHERE borrowed_by=%s
    """,(mem_id,))

    count = cursor.fetchone()[0]

    return {

        "member_id": member[0],
        "name": member[1],
        "books": count

    }

@app.post("/admin-login")
def admin_login(admin: AdminLogin):

    cursor.execute(
        """
        SELECT * FROM members
        WHERE mem_name=%s
        AND password=%s
        AND role='admin'
        """,
        (admin.username, admin.password)
    )

    user = cursor.fetchone()

    if user:
        return {
            "success": True,
            "message": "Admin Login Successful"
        }

    return {
        "success": False,
        "message": "Invalid Username or Password"
    }

    