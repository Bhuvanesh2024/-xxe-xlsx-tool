from app import app
from mangum import Mangum

# Lambda handler
handler = Mangum(app, lifespan="off")
