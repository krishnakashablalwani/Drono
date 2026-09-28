import asyncio
import websockets
import json

async def check():
    uri = "ws://localhost:8000/api/reconstruct/ws/44fe7789-83db-40fb-a3ff-aa6336b944ec"
    async with websockets.connect(uri) as ws:
        msg = await ws.recv()
        print(json.dumps(json.loads(msg), indent=2))

asyncio.run(check())
