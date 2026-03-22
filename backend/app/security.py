from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import time


PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(PBKDF2_ALGORITHM, password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return (
        f"pbkdf2_{PBKDF2_ALGORITHM}$"
        f"{PBKDF2_ITERATIONS}$"
        f"{salt.hex()}$"
        f"{digest.hex()}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    if stored_hash.startswith("pbkdf2_sha256$"):
        _, iterations, salt_hex, digest_hex = stored_hash.split("$", maxsplit=3)
        digest = hashlib.pbkdf2_hmac(
            PBKDF2_ALGORITHM,
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)

    legacy_digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_digest, stored_hash)


def issue_access_token(user_id: int, username: str) -> str:
    payload = f"{user_id}:{username}:{int(time.time())}"
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8").rstrip("=")
