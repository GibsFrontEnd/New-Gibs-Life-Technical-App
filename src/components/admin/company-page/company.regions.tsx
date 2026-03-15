//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { Button } from "../../UI/new-button"
import { useAppDispatch, useAppSelector } from "../../../hooks/use-apps"
import ConfirmationModal from "../../Modals/ConfirmationModal"
import {
 
 clearMessages,
  deleteRegion,
  getAllRegions,
  checkRegionExists,
  selectRegions,
} from "../../../features/reducers/productReducers/regionSlice"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../UI/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../UI/pagination"
import {
  selectUiState,
  setShowCreateRegionDialog,
  setShowDeleteRegionDialog,
  setShowEditRegionDialog,
} from "../../../features/reducers/uiReducers/uiSlice"
import { CreateRegion, EditRegion} from "../../components.region"



// Types
interface Region {
  regionID: number
  region: string
  manager: string
  address: string
  mobilePhone: string
  landPhone: string
  email: string
  fax: string
  remarks: string
  deleted: boolean 
  active: boolean
  submittedBy: string
  submittedOn: string
  modifiedBy: string
  modifiedOn: string
}

const ProductsRegions = () => {
  const dispatch = useAppDispatch()

// Safe destructuring with fallback values
  const { 
    regions = [], 
    success = {}, 
    loading = { getAllRegions: false, deleteRegion: false }, 
    error = {}, 
    exists = null 
  } = useAppSelector(selectRegions) || {}
  const { showDeleteRegionDialog } = useAppSelector(selectUiState)

  const [regionToEdit, setRegionToEdit] = useState<Region | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter states
  const [regionIDFilter, setregionIDFilter] = useState("")
  const [regionFilter, setregionFilter] = useState("")
  const [emailFilter, setemailFilter] = useState("")
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false)
  const [hasRegionFilter, setHasRegionFilter] = useState(false)
  const [hasEmailFilter, setHasEmailFilter] = useState(false)

  //@ts-ignore
 const filteredRegions = (regions || []).filter((region) => {
    const matchesSearch =
      region.regionID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.email?.toLowerCase().includes(searchTerm.toLowerCase()) 


    const matchesRegionID =
      !regionIDFilter || region.regionID?.toLowerCase().includes(regionIDFilter.toLowerCase())
    const matchesRegion =
      !regionFilter || region.region?.toLowerCase().includes(regionFilter.toLowerCase())
    const matchesEmail =
      !emailFilter || region.email?.toLowerCase().includes(emailFilter.toLowerCase())

     const matchesActiveOnly = !activeOnlyFilter || region.active === true
  const matchesHasRegion =
    !hasRegionFilter || (region.region && region.region.trim() !== "")
  const matchesHasEmail =
    !hasEmailFilter || (region.email && region.email.trim() !== "")

    return (
      matchesSearch &&
      matchesRegionID &&
      matchesRegion &&
      matchesEmail &&
      matchesActiveOnly &&
      matchesHasRegion &&
      matchesHasEmail
    )
  })

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 3
  const totalPages = Math.ceil(filteredRegions.length / rowsPerPage)

  const [regionIdToDelete, setRegionIdToDelete] = useState<number | null>(null)
  const [regionIdToCheck, setRegionIdToCheck] = useState<number | null>(null)

  const currentData = filteredRegions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

 // Update statistics calculations
 const safeRegions = regions || []
const totalRecords = safeRegions.length
const regionIDCount = safeRegions.filter((region: { active: any }) => region.active).length // active regions
const regionCount = safeRegions.filter((region: { region: string }) => region.region?.trim()).length // regions with name
const emailCount = safeRegions.filter((region: { email: string }) => region.email?.trim()).length // regions with email
  useEffect(() => {
    dispatch(getAllRegions())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(getAllRegions())
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setregionIDFilter("")
    setregionFilter("")
    setemailFilter("")
    setActiveOnlyFilter(false)
    setHasRegionFilter(false)
    setHasEmailFilter(false)
    setCurrentPage(1)
  }

  const handleCheckExists = (regionId: number) => {
    setRegionIdToCheck(regionId)
    dispatch(checkRegionExists(regionId))
  }

  const confirmDeleteRegion = async (regionId: number | null) => {
    if (!regionId) {
      console.log("No Region Id")
      return
    }

    dispatch(deleteRegion(regionId))

    if (success.deleteRegion) {
      dispatch(clearMessages())
      setRegionIdToDelete(null)
      dispatch(setShowDeleteRegionDialog(false))
    } else if (error.deleteRegion) {
      console.log(error)
    }
  }

  if (error.getAllRegions) {
    console.error("Error fetching Regions:", error)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-col md:flex-row space-y-4 md:space-y-0">
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Regions Management</h1>
            <p className="text-sm text-gray-600">Manage your region management data</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              onClick={handleRefresh}
                //@ts-ignore
              disabled={loading.getAllRegions}
            >
              {loading.getAllRegions ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              className=" bg-[#8b4b8c] hover:bg-[#735974] text-white px-4 py-2 rounded-md font-medium transition-colors"
              onClick={() => dispatch(setShowCreateRegionDialog(true))}
            >
              Create New
            </Button>
            <CreateRegion />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-fuchsia-700">{totalRecords}</div>
          <div className="text-sm text-gray-600 mt-1">Total Regions</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-fuchsia-700">{regionIDCount}</div>
          <div className="text-sm text-gray-600 mt-1">Active Region ID</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-fuchsia-700">{regionCount}</div>
          <div className="text-sm text-gray-600 mt-1">With Region Name</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-fuchsia-700">{emailCount}</div>
          <div className="text-sm text-gray-600 mt-1">With Email</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Region ID</label>
            <input
              type="text"
              placeholder="Filter by Region ID"
              value={regionIDFilter}
              onChange={(e) => setregionIDFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Region</label>
            <input
              type="text"
              placeholder="Filter by Region "
              value={regionFilter}
              onChange={(e) => setregionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="text"
              placeholder="Filter by Email"
              value={emailFilter}
              onChange={(e) => setemailFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center space-x-6 mb-4 space-y-2 md:space-y-0">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnlyFilter}
              onChange={(e) => setActiveOnlyFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>Active Only</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasRegionFilter}
              onChange={(e) => setHasRegionFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>Has Region</span>
          </label>
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasEmailFilter}
              onChange={(e) => setHasEmailFilter(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span> Has Email</span>
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            className="bg-[#8b4b8c] hover:bg-[#735974]  text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" 
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
          <Button 
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" 
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by Region ID, Region Name, or Email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-gray-500"
        />
      </div>

      {/* Exists Indicator */}
      {exists !== null && regionIdToCheck && (
        <div className={`px-4 py-2 rounded-md text-sm font-medium text-center ${
          exists 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          Region ID {regionIdToCheck} {exists ? "exists" : "does not exist"}
        </div>
      )}

      {/* Table Section */}
      {loading.getAllRegions ||
      loading.getActiveRegions ||
      loading.getRegionsByRegion ||
      loading.getRegionsByEmail ? (
        <div className="flex items-center justify-center space-x-3 py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading regions...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region ID</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</TableHead>
                 <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Phone</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</TableHead>
               
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Landphone</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fax</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    No regions found
                  </TableCell>
                </TableRow>
              ) : (
                  //@ts-ignore
                currentData.map((region, index) => (
                  <TableRow key={region.regionID} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-sm text-gray-900">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono text-xs text-gray-600">
                      {region.regionID}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900">
                      <strong className="font-semibold text-blue-600">{region.region}</strong>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                      {region.manager}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700">
                      {region.mobilePhone || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600">
                      {region.address || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono text-xs text-gray-600 uppercase">
                      {region.landPhone|| "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs">
                      {region.email || "-"}

                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono text-xs text-gray-600">
                      {region.fax || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono text-xs text-gray-600">
                      {region.remarks || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        region.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {region.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 space-x-2">
                      <Button
                        className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 px-3 py-1.5 text-xs rounded border font-medium transition-colors"
                        onClick={() => handleCheckExists(region.regionID)}
                      >
                        Check
                      </Button>
                      <Button
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 px-3 py-1.5 text-xs rounded border font-medium transition-colors"
                         onClick={() =>{
                          setRegionToEdit(region);
                          dispatch(setShowEditRegionDialog(true));
                         }}
            >
                        Edit
                      </Button>
                      <Button   //@ts-ignore
                        variant="destructive"
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 px-3 py-1.5 text-xs rounded border font-medium transition-colors"
                        onClick={() => {
                          setRegionIdToDelete(region.regionID)
                          dispatch(setShowDeleteRegionDialog(true))
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {filteredRegions.length > 0
                  ? `${(currentPage - 1) * rowsPerPage + 1} to ${Math.min(
                      currentPage * rowsPerPage,
                      filteredRegions.length,
                    )} of ${filteredRegions.length}`
                  : "0 to 0 of 0"}
              </span>{" "}
              Regions
            </div>

            <Pagination className="flex items-center space-x-1">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page >= Math.max(1, currentPage - 2) &&
                      page <= Math.min(totalPages, currentPage + 2),
                  )
                  .map((page) => (
                    <PaginationItem key={page} className="mx-0.5">
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                        className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 transition-colors"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

       <CreateRegion />
      <EditRegion region={regionToEdit ? { ...regionToEdit, regionID: String(regionToEdit.regionID) } : null} /> 

      {showDeleteRegionDialog && (
        <ConfirmationModal
          title="Delete Region"
          message="Are you sure you want to delete this region? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => confirmDeleteRegion(regionIdToDelete)}
          onCancel={() => dispatch(setShowDeleteRegionDialog(false))}
          isLoading={!!loading.deleteRegion}
        />
      )}
    </div>
  )
}

export default ProductsRegions