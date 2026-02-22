import json
import re
import sqlite3
from datetime import datetime, timezone
from difflib import SequenceMatcher
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'database' / 'mini_ai.db'

ALIASES = {
    'u': 'you',
    'ur': 'your',
    'r': 'are',
    'im': 'i am',
    'dont': 'do not',
    'cant': 'can not',
    'wanna': 'want to',
    'gonna': 'going to',
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS knowledge (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              question TEXT NOT NULL,
              answer TEXT NOT NULL,
              created_at TEXT NOT NULL
            )
            '''
        )
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sender TEXT NOT NULL,
              text TEXT NOT NULL,
              created_at TEXT NOT NULL
            )
            '''
        )
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            '''
        )
        conn.commit()


def normalize(text: str) -> str:
    lowered = text.lower().strip()
    cleaned = re.sub(r"[^a-z0-9\s]", ' ', lowered)
    tokens = [ALIASES.get(token, token) for token in cleaned.split()]
    expanded = ' '.join(tokens)
    expanded = re.sub(r'\s+', ' ', expanded).strip()
    return expanded


def token_set(text: str) -> set[str]:
    return set(normalize(text).split())


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def learn(question: str, answer: str) -> None:
    q = normalize(question)
    a = answer.strip()
    if not q or not a:
        return
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            'INSERT INTO knowledge(question, answer, created_at) VALUES (?, ?, ?)',
            (q, a, now_iso()),
        )
        conn.commit()


def lookup(message: str) -> str | None:
    msg = normalize(message)
    if not msg:
        return 'Please type a message so I can help.'

    keyword_rules = {
        'invoice': 'Invoice status: 2 paid, 1 pending review. Want me to list line items?',
        'milestone': 'Milestones: Discovery ✅ Prototype ✅ Build in progress ⏳ Launch planned next sprint.',
        'shop': 'The shop has UI kits, game logic modules, and sky/cloud asset packs.',
        'hello': 'Hey! I am Zenith Mini AI. Ask me about milestones, invoices, or project scope.',
    }

    for key, value in keyword_rules.items():
        if key in msg:
            return value

    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute('SELECT question, answer FROM knowledge ORDER BY id DESC').fetchall()

    msg_tokens = token_set(msg)
    best_answer = None
    best_score = 0.0

    for question, answer in rows:
        if question in msg or msg in question:
            return answer

        q_tokens = token_set(question)
        overlap = len(msg_tokens & q_tokens)
        overlap_ratio = overlap / max(len(q_tokens), 1)
        sim = similarity(msg, question)
        score = max(sim, overlap_ratio)

        if score > best_score:
            best_score = score
            best_answer = answer

    if best_answer and best_score >= 0.62:
        return best_answer

    return None


def add_message(sender: str, text: str) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('INSERT INTO messages(sender, text, created_at) VALUES (?, ?, ?)', (sender, text, now_iso()))
        conn.commit()


def list_messages() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute('SELECT id, sender, text, created_at FROM messages ORDER BY id ASC').fetchall()
    return [{'id': r[0], 'sender': r[1], 'text': r[2], 'created_at': r[3]} for r in rows]


def list_knowledge() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute('SELECT id, question, answer, created_at FROM knowledge ORDER BY id DESC').fetchall()
    return [{'id': r[0], 'question': r[1], 'answer': r[2], 'created_at': r[3]} for r in rows]


def delete_knowledge(item_id: int) -> bool:
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute('DELETE FROM knowledge WHERE id = ?', (item_id,))
        conn.commit()
        return cur.rowcount > 0


def get_setting(key: str, default: str = '') -> str:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute('SELECT value FROM settings WHERE key = ?', (key,)).fetchone()
    return row[0] if row else default


def set_setting(key: str, value: str) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            'INSERT INTO settings(key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
            (key, value, now_iso()),
        )
        conn.commit()


class Handler(SimpleHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict | list) -> None:
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == '/api/messages':
            self._send_json(200, {'messages': list_messages()})
            return
        if parsed.path == '/api/knowledge':
            self._send_json(200, {'items': list_knowledge()})
            return
        if parsed.path == '/api/settings':
            self._send_json(200, {'announcement': get_setting('announcement')})
            return
        super().do_GET()

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != '/api/knowledge':
            self._send_json(404, {'error': 'Not found'})
            return

        params = parse_qs(parsed.query)
        item_id = params.get('id', [''])[0]
        if not item_id.isdigit():
            self._send_json(400, {'error': 'valid id required'})
            return

        ok = delete_knowledge(int(item_id))
        self._send_json(200, {'ok': ok})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path not in ('/api/chat', '/api/teach', '/api/messages', '/api/settings'):
            self._send_json(404, {'error': 'Not found'})
            return

        length = int(self.headers.get('Content-Length', '0'))
        raw = self.rfile.read(length).decode('utf-8') if length else '{}'

        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            self._send_json(400, {'error': 'Invalid JSON body'})
            return

        if parsed.path == '/api/teach':
            question = str(payload.get('question', ''))
            answer = str(payload.get('answer', ''))
            if not question.strip() or not answer.strip():
                self._send_json(400, {'error': 'question and answer are required'})
                return
            learn(question, answer)
            self._send_json(200, {'ok': True, 'message': 'Learned new response.'})
            return

        if parsed.path == '/api/messages':
            sender = str(payload.get('sender', '')).strip() or 'Unknown'
            text = str(payload.get('text', '')).strip()
            if not text:
                self._send_json(400, {'error': 'text required'})
                return
            add_message(sender, text)
            self._send_json(200, {'ok': True})
            return

        if parsed.path == '/api/settings':
            announcement = str(payload.get('announcement', '')).strip()
            set_setting('announcement', announcement)
            self._send_json(200, {'ok': True, 'announcement': announcement})
            return

        message = str(payload.get('message', ''))
        learned = lookup(message)
        if learned:
            self._send_json(200, {'reply': learned, 'source': 'learned'})
            return

        self._send_json(
            200,
            {
                'reply': 'I am still learning that topic. You can teach me below with a question/answer pair.',
                'source': 'fallback',
            },
        )


if __name__ == '__main__':
    init_db()
    print('Zenith server running at http://0.0.0.0:4173')
    ThreadingHTTPServer(('0.0.0.0', 4173), Handler).serve_forever()
