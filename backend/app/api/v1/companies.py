from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import RoleChecker, get_current_user_id
from app.core.response import success_response
from app.database.mongodb import get_database
from app.models import UserRole
from app.schemas import CompanyCreate, CompanyUpdate
from app.services import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])

allow_all = RoleChecker([r.value for r in UserRole])


@router.get("")
async def list_companies(
    keyword: str | None = Query(None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = CompanyService(db)
    items, total = await service.list_companies(page, per_page, keyword=keyword)
    return success_response(
        data={"items": items, "total": total, "page": page, "per_page": per_page}
    )


@router.get("/{company_id}")
async def get_company(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = CompanyService(db)
    company = await service.get_company(company_id)
    return success_response(data=company)


@router.post("")
async def create_company(
    data: CompanyCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = CompanyService(db)
    company = await service.create_company(user_id, data)
    return success_response(data=company, message="Company created", status_code=201)


@router.put("/{company_id}")
async def update_company(
    company_id: str,
    data: CompanyUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = CompanyService(db)
    company = await service.update_company(company_id, data)
    return success_response(data=company, message="Company updated")


@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    _=Depends(allow_all),
):
    service = CompanyService(db)
    await service.delete_company(company_id)
    return success_response(message="Company deleted")
