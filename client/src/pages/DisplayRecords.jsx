import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiRefreshCw, FiSearch } from "react-icons/fi";
import { FaChartPie } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { motion, AnimatePresence } from "framer-motion";
import concordLogo from "../assets/Concord_Logo.png";

const WarehouseDashboard = () => {
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 12, // 4 columns × 2 rows
    total: 0,
  });
  const [autoSlide, setAutoSlide] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // For pagination highlighting
  const slideIntervalRef = useRef(null);

  const fetchData = async (page = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/getData", {
        params: {
          page,
          pageSize: pageInfo.pageSize,
          search: searchTerm,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch data");
      }

      setFabrics(response.data.data);
      setPageInfo({
        ...pageInfo,
        page,
        total: response.data.totalCount,
      });
      setCurrentPage(page - 1); // Update current page for pagination
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load data");
      setFabrics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(1, search);
    if (autoSlide) {
      resetAutoSlide();
    }
  };

  const handleRefresh = () => {
    fetchData(pageInfo.page, search);
    if (autoSlide) {
      resetAutoSlide();
    }
  };

  const handlePageClick = (data) => {
    const newPage = data.selected + 1;
    fetchData(newPage, search);
    if (autoSlide) {
      resetAutoSlide();
    }
  };

  const toggleAutoSlide = () => {
    setAutoSlide(!autoSlide);
    if (!autoSlide) {
      startAutoSlide();
    } else {
      clearInterval(slideIntervalRef.current);
    }
  };

  const startAutoSlide = () => {
    clearInterval(slideIntervalRef.current);

    slideIntervalRef.current = setInterval(() => {
      const nextPage =
        pageInfo.page >= Math.ceil(pageInfo.total / pageInfo.pageSize)
          ? 1
          : pageInfo.page + 1;
      fetchData(nextPage, search);
    }, 30000);
  };

  const resetAutoSlide = () => {
    if (autoSlide) {
      clearInterval(slideIntervalRef.current);
      startAutoSlide();
    }
  };

  useEffect(() => {
    fetchData();
    if (autoSlide) {
      startAutoSlide();
    }

    return () => {
      clearInterval(slideIntervalRef.current);
    };
  }, []);

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0 },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="px-4 py-6 min-h-screen bg-gradient-to-bl from-blue-400 to-green-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-2">
        <div className="flex items-center">
          <motion.div>
            <img width="80px" src={concordLogo} alt="logoImg" />
            {/* <FaChartPie className="text-6xl mr-4 text-white" /> */}
          </motion.div>
          <div className="flex flex-col ml-3">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              Fabric Location Dashboard
            </h1>
            <p className="text-white/100 tracking-wider text-xl">
              |Powered by Concord IT Team
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search fabrics..."
              className="pl-10 pr-4 py-2 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-500" />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </form>
      </div>

      {/* Auto-slide toggle */}
      <div className="flex justify-end mb-4">
        <label className="flex items-center space-x-2 bg-white/90 px-4 py-2 rounded-lg shadow">
          <span className="text-sm font-medium">Auto Slide Pages (30s)</span>
          <input
            type="checkbox"
            checked={autoSlide}
            onChange={toggleAutoSlide}
            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Fabric Grid with Framer Motion animations */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pageInfo.page} // This ensures animation on page change
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-6 gap-6 mb-8"
            >
              {fabrics.map((fabric, index) => (
                <motion.div
                  key={
                    fabric
                      ? `${fabric.ITEM_CODE}-${fabric.FAB_PO_NO}-${pageInfo.page}`
                      : `empty-${index}-${pageInfo.page}`
                  }
                  variants={cardVariants}
                  className={`bg-white rounded-lg shadow-md overflow-hidden ${
                    !fabric ? "invisible" : ""
                  }`}
                >
                  {fabric && (
                    <>
                      <div className="flex flex-col h-full">
                        {/* Top - Always at top */}
                        <div className="bg-teal-600 text-white p-4">
                          <h2 className="text-md font-bold truncate">
                            {fabric.ITEM_CODE}
                          </h2>
                          <p className="text-xm truncate">
                            {fabric.BUYER_NAME} | Total: {fabric.totalQty}{" "}
                            {fabric.UOM}
                          </p>
                          <p className="text-sm">PO: {fabric.FAB_PO_NO}</p>
                        </div>

                        {/* Middle - Centered between top and bottom */}
                        <div className="p-4 max-h-60 overflow-y-auto flex-1 flex">
                          <table className="w-full">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="p-2 text-left text-xs">
                                  Location
                                </th>
                                <th className="p-2 text-left text-xs">
                                  Barcode
                                </th>
                                <th className="p-2 text-left text-xs">Qty</th>
                              </tr>
                            </thead>
                            <tbody className="top-0">
                              {fabric.locations.map((location, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2 text-sm">
                                    {location.FULL_LOCATION}
                                  </td>
                                  <td className="p-2 text-xs font-mono">
                                    {location.BAR_CODE}
                                  </td>
                                  <td className="p-2 text-sm">
                                    {location.QTY}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Bottom - Always at bottom */}
                        <div className="bg-gray-200/50 p-3 text-sm">
                          <p className="truncate">
                            Supplier: {fabric.MATERIAL_SUPPLIER_NAME || "N/A"}
                          </p>
                          <p>
                            Received:{" "}
                            {fabric.locations[0]?.RECEIVED_DATE
                              ? new Date(
                                  fabric.locations[0].RECEIVED_DATE
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p>Status: {fabric.INSPECTION_STATUS || "N/A"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {pageInfo.total > pageInfo.pageSize && (
            <div className="flex justify-center">
              <ReactPaginate
                previousLabel={"< Previous"}
                nextLabel={"Next >"}
                breakLabel={"..."}
                pageCount={Math.ceil(pageInfo.total / pageInfo.pageSize)}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={"flex gap-2 items-center"}
                pageClassName={"px-3 py-1 border rounded hover:bg-gray-100"}
                activeClassName={"bg-blue-600 text-white"}
                previousClassName={"px-3 py-1 border rounded hover:bg-gray-100"}
                nextClassName={"px-3 py-1 border rounded hover:bg-gray-100"}
                disabledClassName={"opacity-50 cursor-not-allowed"}
                forcePage={currentPage} // Now correctly highlights current page
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WarehouseDashboard;
