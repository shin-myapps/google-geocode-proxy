export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat/lon" });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === "OK" && data.results.length > 0) {
    const formatted = data.results[0].formatted_address;
    res.status(200).json({ display_name: formatted });
  } else {
    res.status(400).json({ error: data.status });
  }
}
