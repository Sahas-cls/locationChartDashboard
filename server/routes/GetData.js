const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");
 
router.get("/getData", async (req, res) => {
  console.log("getting data");
  try {
    const { search = "", page = 1, pageSize = 8 } = req.query;
    const offset = (page - 1) * pageSize;
    const pool = await poolPromise;
    const request = pool.request();
 
    // First get distinct items with their total quantities
    const itemsQuery = `
      SELECT
        ITEM_CODE,
        SUM(MLS_QTY) AS TOTAL_QTY,
        MAX(UOM) AS UOM,
        MAX(BUYER_NAME) AS BUYER_NAME,
        MAX(MATERIAL_SUPPLIER_NAME) AS MATERIAL_SUPPLIER_NAME
      FROM VIEW_MATERIAL_STOCK_COMBINED
      WHERE BUYER_NAME LIKE 'BLAKLADER'
        ${search ? ` AND (ITEM_CODE LIKE '%' + @search + '%' OR MATERIAL_SUPPLIER_NAME LIKE '%' + @search + '%')` : ""}
      GROUP BY ITEM_CODE
      ORDER BY ITEM_CODE
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `;
 
    if (search) request.input("search", search);
 
    const itemsResult = await request.query(itemsQuery);
    const items = itemsResult.recordset;
 
    if (items.length === 0) {
      return res.json({
        success: true,
        data: [],
        totalCount: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      });
    }
 
    // Then get all locations for these items
    const locationsQuery = `
      SELECT
        ITEM_CODE,
        FAB_PO_NO,
        INVOICE_NO,
        STOCK_LOCATION AS MLS_STOCK_LOCAT,
        MLS_RACK_NO,
        MLS_SHELF_NO,
        SUM(MLS_QTY) AS QTY
      FROM VIEW_MATERIAL_STOCK_COMBINED
      WHERE ITEM_CODE IN (${items.map(item => `'${item.ITEM_CODE}'`).join(',')})
      GROUP BY
        ITEM_CODE,
        FAB_PO_NO,
        INVOICE_NO,
        STOCK_LOCATION,
        MLS_RACK_NO,
        MLS_SHELF_NO
      ORDER BY ITEM_CODE, FAB_PO_NO
    `;
 
    const locationsResult = await request.query(locationsQuery);
    const allLocations = locationsResult.recordset;
 
    // Combine data
    const formattedData = items.map((item) => {
      const locations = allLocations
        .filter(loc => loc.ITEM_CODE === item.ITEM_CODE)
        .map((loc) => ({
          FAB_PO_NO: loc.FAB_PO_NO,
          FULL_LOCATION: `${loc.MLS_STOCK_LOCAT}-${loc.MLS_RACK_NO}-${loc.MLS_SHELF_NO}`,
          INVOICE_NO: loc.INVOICE_NO,
          QTY: parseFloat(loc.QTY)
        }));
 
      return {
        ITEM_CODE: item.ITEM_CODE,
        TOTAL_QTY: parseFloat(item.TOTAL_QTY),
        UOM: item.UOM,
        BUYER_NAME: item.BUYER_NAME,
        MATERIAL_SUPPLIER_NAME: item.MATERIAL_SUPPLIER_NAME,
        locations
      };
    });
 
    // Get total count of distinct items
    const countQuery = `
      SELECT COUNT(DISTINCT ITEM_CODE) as total
      FROM VIEW_MATERIAL_STOCK_COMBINED
      WHERE BUYER_NAME LIKE 'BLAKLADER'
        ${search ? ` AND (ITEM_CODE LIKE '%' + @search + '%' OR MATERIAL_SUPPLIER_NAME LIKE '%' + @search + '%')` : ""}
    `;
 
    const countResult = await request.query(countQuery);
    const totalCount = countResult.recordset[0].total;
 
    res.json({
      success: true,
      data: formattedData,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({
      success: false,
      error: "Data fetching failed",
      details: error.message,
    });
  }
});
 
module.exports = router;