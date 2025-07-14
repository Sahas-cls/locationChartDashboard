import React, { useEffect, useState } from "react";
import { readExcelFile } from "../utils/readExcelFile";
import ReactPaginate from "react-paginate";
import { motion, AnimatePresence } from "framer-motion";

const allowedFields = ["LOCATION", "INVOICE NO", "PO NO", "QTY", "BALANCE"];
const ITEMS_PER_PAGE = 15;

const DisplayRecords = () => {
  const [data, setData] = useState([]);
  const [searchKey, setSearchKey] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const filePath = "/Fabric_Inventory_Report-STOCK.xlsx";

  const loadData = async () => {
    try {
      const allData = await readExcelFile(filePath);
      setData(allData);
      setLastUpdated(new Date().toLocaleTimeString());
      setSearchKey("");
      setCurrentPage(0);
    } catch (error) {
      console.error("Error reading Excel file:", error);
    }
  };

  useEffect(() => {
    // REFRESH DATA-SET ONCE A EVERY 30 MINUTES
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchKey]);

  // Auto-slide pages every 1 minute
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentPage((prevPage) =>
        prevPage + 1 < pageCount ? prevPage + 1 : 0
      );
    }, 13000);

    return () => clearInterval(slideInterval);
  }, [data, searchKey]);

  const groupByItemCord = (rows) => {
    const grouped = {};
    rows.forEach((row) => {
      const itemCord = row["ITEM CORD"];
      if (!grouped[itemCord]) {
        grouped[itemCord] = [];
      }
      grouped[itemCord].push(row);
    });
    return grouped;
  };

  const filteredData = searchKey
    ? data.filter((row) => row["ITEM CORD"] === searchKey)
    : data;

  const groupedData = groupByItemCord(filteredData);
  const groupedEntries = Object.entries(groupedData);

  const pageCount = Math.ceil(groupedEntries.length / ITEMS_PER_PAGE);
  const pageData = groupedEntries.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div className="p-4">
      <h2 className="text-center text-4xl font-bold mb-16 uppercase tracking-wider underline text-blue-900">
        Location Chart
      </h2>

      <fieldset className="mb-4 flex justify-end items-center gap-2 border-black/10">
        <input
          type="text"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          className="border-2 border-black/30 py-2 px-4 rounded-md"
          placeholder="Search by ITEM CORD"
        />
        <button
          onClick={loadData}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Reload Data
        </button>
      </fieldset>

      {lastUpdated && (
        <p className="text-md text-gray-600 text-right mb-4 mr-1 text-red-600">
          Last refreshed at: {lastUpdated}
        </p>
      )}

      {groupedEntries.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-5 text-sm gap-4"
            >
              {pageData.map(([itemCord, records], index) => (
                <div
                  key={index}
                  className="border-gray-300 p-4 rounded-md shadow-md border-2 border-black/30"
                >
                  <h3 className="text-lg font-bold mb-2 text-green-700 text-center uppercase tracking-wide">
                    Item Cord: {itemCord}
                  </h3>
                  {records.map((row, i) => (
                    <div key={i} className="mb-2">
                      {Object.entries(row)
                        .filter(([key]) => allowedFields.includes(key))
                        .map(([key, value]) => (
                          <p key={key}>
                            <strong>{key}:</strong>{" "}
                            {key === "LOCATION" ? (
                              <span className="bg-yellow-400 font-bold text-black px-1 py-1 rounded shadow inline-block">
                                {value}
                              </span>
                            ) : (
                              value
                            )}
                          </p>
                        ))}
                      {i !== records.length - 1 && (
                        <hr className="my-2 border-gray-400 shadow-md border-2 opacity-50 bg-gradient-to-r from-transparent to-gray-400 h-2" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-center">
            <ReactPaginate
              previousLabel={"← Prev"}
              nextLabel={"Next →"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={1}
              pageRangeDisplayed={3}
              onPageChange={handlePageChange}
              containerClassName={"pagination flex gap-2"}
              activeClassName={"text-white bg-blue-600 px-3 py-1 rounded"}
              pageClassName={"px-3 py-1 border rounded hover:bg-gray-200"}
              previousClassName={"px-3 py-1 border rounded"}
              nextClassName={"px-3 py-1 border rounded"}
              disabledClassName={"opacity-50"}
              forcePage={currentPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DisplayRecords;
