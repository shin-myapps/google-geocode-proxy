// /api/geocode.js
export default async function handler(req, res) {
  try {
    let { lat, lon, lng } = req.query;

    // normalize input (accepts lon or lng, strips ° and text)
    lat = parseFloat((lat || "").replace(/[^\d.-]/g, ""));
    lon = parseFloat((lon || lng || "").replace(/[^\d.-]/g, ""));

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "Invalid or missing latitude/longitude" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
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

    // Extract fields into maps.co/Nominatim style
    const components = {};
    result.address_components.forEach(c => {
      if (c.types.includes("locality")) components.city = c.long_name;
      if (c.types.includes("administrative_area_level_1")) components.province = c.long_name;
      if (c.types.includes("country")) components.country = c.long_name;
      if (c.types.includes("postal_code")) components.postcode = c.long_name;
      if (c.types.includes("sublocality") || c.types.includes("neighborhood")) {
        components.suburb = c.long_name;
      }
    });

    return res.status(200).json({
      display_name: result.formatted_address,
      address: components
    });

  } catch (e) {
    return res.status(500).json({ error: "Internal server error", details: e.message });
  }
}
