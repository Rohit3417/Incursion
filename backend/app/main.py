from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Import your routers here
from backend.app.api import upload
from backend.app.api import runs
from backend.app.api import overrides
from backend.app.api import configs
from backend.app.api import rank
from backend.app.api import enrich
from backend.app.api import compare
from backend.app.api import export
from backend.app.api import verify

app = FastAPI(title="Incursion Recruitment Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "supabase"}

# Placeholder for upcoming routers[cite: 1]
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(configs.router, prefix="/api/configs", tags=["Configurations"])
app.include_router(runs.router, prefix="/api/runs", tags=["Runs"])
app.include_router(rank.router, prefix="/api/rank", tags=["Ranking"])
app.include_router(overrides.router, prefix ="/api/runs", tags=["Overrides"])
app.include_router(enrich.router, prefix = "/api/enrich", tags=["Enrichment"])
app.include_router(compare.router, prefix="/api/compare", tags=["Compare"])
app.include_router(export.router, prefix="/api/runs", tags=["Export"])
app.include_router(verify.router, prefix="/api/runs", tags=["Verification"])