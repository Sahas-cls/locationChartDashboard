import axios from "axios";

const backendUrl = import.meta.env.VITE_API_URL;
console.log("backend url", backendUrl);

export const readDatabase = async () => {
  alert("fetching data");
  try {
    const response = await axios.get(`${backendUrl}/getData`, {
      withCredentials: true, // only needed if you're using cookies/auth
    });

    if (response.data.success) {
      return response.data.data; // <-- your actual DB records
    } else {
      console.error("Failed to fetch data:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};
