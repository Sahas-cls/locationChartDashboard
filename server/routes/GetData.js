const express = require("express");
const router = express.Router();
const { poolPromise } = require("../db");

router.get("/getData", async (req, res) => {
  try {
    const { search = "", page = 1, pageSize = 8 } = req.query;
    const offset = (page - 1) * pageSize;
    const pool = await poolPromise;
    const request = pool.request();

    // First get the distinct groups for pagination
    const groupsQuery = `
      SELECT DISTINCT 
        ITEM_CODE, FAB_PO_NO, BUYER_NAME, UOM, 
        MATERIAL_SUPPLIER_NAME, INSPECTION_STATUS
      FROM VIEW_FABRIC_STOCK_DETAILS WITH (NOLOCK)
      WHERE COM_CODE = 1 
        AND LOCATION_CODE = 1
        AND STOCK_LOCATION LIKE 'MAIN'
        AND ITEM_CODE IS NOT NULL
        AND RECEIVED_DATE > '2025-01-01'
        AND CATEGORY_CODE LIKE 'FAB'
        ${
          search
            ? ` AND (ITEM_CODE LIKE '%' + @search + '%' OR MATERIAL_SUPPLIER_NAME LIKE '%' + @search + '%')`
            : ""
        }
      ORDER BY ITEM_CODE, FAB_PO_NO
      OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
    `;

    if (search) request.input("search", search);

    const groupsResult = await request.query(groupsQuery);
    const groups = groupsResult.recordset;

    if (groups.length === 0) {
      return res.json({
        success: true,
        data: [],
        totalCount: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      });
    }

    // Then get all locations for these groups
    const locationsQuery = `
      SELECT 
        ITEM_CODE, FAB_PO_NO, STOCK_BAR_CODE, RACK_NO, SHELF_NO, 
        STOCK_LOCATION, QTY, RECEIVED_DATE, INVOICE_NO
      FROM VIEW_FABRIC_STOCK_DETAILS WITH (NOLOCK)
      WHERE (${groups
        .map(
          (g) =>
            `(ITEM_CODE = '${g.ITEM_CODE}' AND FAB_PO_NO = '${g.FAB_PO_NO}')`
        )
        .join(" OR ")})
      ORDER BY ITEM_CODE, FAB_PO_NO, STOCK_BAR_CODE
    `;

    const locationsResult = await request.query(locationsQuery);
    const allLocations = locationsResult.recordset;

    // Combine data
    const formattedData = groups.map((group) => {
      const locations = allLocations
        .filter(
          (loc) =>
            loc.ITEM_CODE === group.ITEM_CODE &&
            loc.FAB_PO_NO === group.FAB_PO_NO
        )
        .map((loc) => ({
          BAR_CODE: loc.STOCK_BAR_CODE,
          RACK_NO: loc.RACK_NO,
          SHELF_NO: loc.SHELF_NO,
          STOCK_LOCATION: loc.STOCK_LOCATION,
          QTY: parseFloat(loc.QTY),
          RECEIVED_DATE: loc.RECEIVED_DATE,
          INVOICE_NO: loc.INVOICE_NO,
          FULL_LOCATION: loc.RACK_NO
            ? `${loc.STOCK_LOCATION}-${loc.RACK_NO}-${loc.SHELF_NO}`
            : "Not specified",
        }));

      return {
        ...group,
        locations,
        totalQty: locations.reduce((sum, loc) => sum + loc.QTY, 0),
      };
    });

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT CONCAT(ITEM_CODE, '_', FAB_PO_NO)) as total
      FROM VIEW_FABRIC_STOCK_DETAILS WITH (NOLOCK)
      WHERE COM_CODE = 1 
        AND STOCK_LOCATION LIKE 'MAIN'
        AND ITEM_CODE IS NOT NULL
        AND RECEIVED_DATE > '2025-01-01'
        AND CATEGORY_CODE LIKE 'FAB'
        ${
          search
            ? ` AND (ITEM_CODE LIKE '%' + @search + '%' OR MATERIAL_SUPPLIER_NAME LIKE '%' + @search + '%')`
            : ""
        }
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
