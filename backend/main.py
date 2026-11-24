from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import conn, cursor

app = FastAPI()

# Allow frontend to connect across local environments and all Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bhargav-library.vercel.app",
        "https://library-management-system-ashy-three-16.vercel.app",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Prevent unhandled 500 plain-text crashes that break frontend JSON parsers."""
    try:
        conn.rollback()
    except Exception:
        pass
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": f"Database or Server error: {str(exc)}"
        }
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

class DeleteMember(BaseModel):
    mem_id: int

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
    try:
        # Find the lowest available positive integer ID (filling any gaps continuously)
        cursor.execute("""
            SELECT s.id
            FROM generate_series(1, (SELECT COALESCE(MAX(mem_id), 0) + 1 FROM members)) s(id)
            WHERE NOT EXISTS (
                SELECT 1 FROM members m WHERE m.mem_id = s.id
            )
            ORDER BY s.id ASC
            LIMIT 1
        """)
        row = cursor.fetchone()
        next_id = int(row[0]) if row and row[0] is not None else 1

        cursor.execute(
            """
            INSERT INTO members(mem_id, mem_name, password, role)
            VALUES(%s, %s, %s, 'user')
            RETURNING mem_id
            """,
            (next_id, member.mem_name, member.password)
        )
        member_id = cursor.fetchone()[0]

        # Keep sequence aligned with the maximum mem_id
        cursor.execute("SELECT setval('members_mem_id_seq', (SELECT GREATEST(MAX(mem_id), 1) FROM members))")
        conn.commit()

        return {
            "success": True,
            "message": "Registration Successful",
            "member_id": member_id
        }
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }


@app.post("/add-book")
def add_book(book: Book):
    try:
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
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to add book: {str(e)}"
        }


@app.delete("/delete-book")
def delete_book(book: DeleteBook):
    try:
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
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to delete book: {str(e)}"
        }


@app.put("/update-profile")
def update_profile(user: UpdateProfile):
    try:
        cursor.execute(
            """
            UPDATE members
            SET mem_name=%s
            WHERE mem_id=%s
            """,
            (user.mem_name, user.mem_id)
        )
        conn.commit()

        return {
            "success": True,
            "message": "Name Updated Successfully"
        }
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to update profile: {str(e)}"
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
    try:
        cursor.execute(
            """
            UPDATE books
            SET title=%s,
                author=%s,
                genre=%s
            WHERE book_id=%s
            """,
            (
                book.title,
                book.author,
                book.genre,
                book.book_id
            )
        )
        conn.commit()

        return {
            "success": True,
            "message": "Book Updated Successfully"
        }
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to update book: {str(e)}"
        }


def _resequence_members_if_needed():
    """Ensure member IDs are strictly contiguous (1..N) without random gaps."""
    try:
        cursor.execute("SELECT mem_id FROM members ORDER BY mem_id ASC")
        rows = cursor.fetchall()
        if not rows:
            return
        current_ids = [r[0] for r in rows]
        # Check if there are gaps (e.g. 1..8 then 12, 13)
        has_gaps = any(current_ids[i] != i + 1 for i in range(len(current_ids)))
        if has_gaps:
            # Shift to temporary negative IDs to avoid unique constraint collision
            for idx, old_id in enumerate(current_ids):
                new_id = idx + 1
                if old_id != new_id:
                    temp_id = -(idx + 10000)
                    cursor.execute("UPDATE books SET borrowed_by=%s WHERE borrowed_by=%s", (temp_id, old_id))
                    cursor.execute("UPDATE members SET mem_id=%s WHERE mem_id=%s", (temp_id, old_id))

            # Assign new continuous 1..N IDs
            for idx, old_id in enumerate(current_ids):
                new_id = idx + 1
                if old_id != new_id:
                    temp_id = -(idx + 10000)
                    cursor.execute("UPDATE books SET borrowed_by=%s WHERE borrowed_by=%s", (new_id, temp_id))
                    cursor.execute("UPDATE members SET mem_id=%s WHERE mem_id=%s", (new_id, temp_id))

            cursor.execute("SELECT setval('members_mem_id_seq', (SELECT GREATEST(MAX(mem_id), 1) FROM members))")
            conn.commit()
    except Exception:
        conn.rollback()


@app.get("/members")
def get_members():
    # Keep IDs cleanly continuous and sorted
    _resequence_members_if_needed()
    cursor.execute("""
        SELECT mem_id, mem_name, role
        FROM members
        ORDER BY mem_id ASC
    """)
    members = cursor.fetchall()
    return members


@app.delete("/delete-member")
def delete_member(member: DeleteMember):
    try:
        cursor.execute("SELECT role FROM members WHERE mem_id=%s", (member.mem_id,))
        row = cursor.fetchone()
        if not row:
            return {"success": False, "message": "Member not found"}
        if row[0] == "admin":
            return {"success": False, "message": "Cannot delete admin account"}

        # Release borrowed books if any
        cursor.execute("UPDATE books SET borrowed_by=NULL WHERE borrowed_by=%s", (member.mem_id,))
        cursor.execute("DELETE FROM members WHERE mem_id=%s", (member.mem_id,))
        conn.commit()

        # Resequence IDs so remaining members continue in strict sequence
        _resequence_members_if_needed()

        return {
            "success": True,
            "message": "Member Deleted Successfully"
        }
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to delete member: {str(e)}"
        }


@app.post("/resequence-members")
def resequence_members():
    try:
        _resequence_members_if_needed()
        return {
            "success": True,
            "message": "Members Resequenced Successfully"
        }
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Resequencing failed: {str(e)}"
        }


@app.put("/borrow-book")
def borrow_book(book: BorrowBook):
    try:
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
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to borrow book: {str(e)}"
        }


@app.post("/user-login")
def user_login(user: UserLogin):
    try:
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
    except Exception as e:
        return {
            "success": False,
            "message": f"Login error: {str(e)}"
        }


@app.get("/my-books/{mem_id}")
def my_books(mem_id: int):
    cursor.execute("""
        SELECT *
        FROM books
        WHERE borrowed_by=%s
    """, (mem_id,))
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
    try:
        cursor.execute("""
            UPDATE books
            SET borrowed_by=NULL
            WHERE book_id=%s
        """, (book.book_id,))
        conn.commit()

        return {
            "success": True,
            "message": "Book Returned Successfully"
        }
    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "message": f"Failed to return book: {str(e)}"
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
    """, (genre, book_id))
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
    """, (mem_id,))
    member = cursor.fetchone()

    cursor.execute("""
        SELECT COUNT(*)
        FROM books
        WHERE borrowed_by=%s
    """, (mem_id,))
    count_row = cursor.fetchone()
    count = count_row[0] if count_row else 0

    if not member:
        return {
            "member_id": mem_id,
            "name": "Unknown",
            "books": count
        }

    return {
        "member_id": member[0],
        "name": member[1],
        "books": count
    }


@app.post("/admin-login")
def admin_login(admin: AdminLogin):
    try:
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
    except Exception as e:
        return {
            "success": False,
            "message": f"Login error: {str(e)}"
        }
