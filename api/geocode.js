// /api/geocode.js
export default async function handler(req, res) {
  try {
    console.log("Incoming query:", req.query);

    let { lat, lon, lng } = req.query;

    // normalize input (remove ° or text, keep decimals)
    lat = (lat || "").replace(/[^\d.-]/g, "");
    lon = (lon || lng || "").replace(/[^\d.-]/g, "");

    if (!lat || !lon) {
      return res.status(400).json({ error: "Bad request: lat/lon required", received: req.query });
    }

    const apiKey = process.env.GOOGLE_API_KEY; // <- must match your Vercel environment variable
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Google API key" });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(400).json({ error: data.status, message: data.error_message });
    }

    const result = data.results[0];
    if (!result) {
      return res.status(404).json({ error: "No results found" });
    }

    // Extract maps.co/Nominatim-style fields
    const components = {};
    result.address_components.forEach(c => {
      if (c.types.includes("locality")) components.city = c.long_name;
      if (c.types.includes("administrative_area_level_1")) components.state = c.long_name;
      if (c.types.includes("country")) components.country = c.long_name;
      if (c.types.includes("postal_code")) components.postcode = c.long_name;
      if (c.types.includes("sublocality") || c.types.includes("neighborhood")) {
        components.suburb = c.long_name;
      }
    });

    // maps.co style JSON
    return res.status(200).json({
      display_name: result.formatted_address,
      address: components
    });

  } catch (e) {
    return res.status(500).json({ error: "Internal server error", details: e.message });
  }
}
