const guid = "436ec1ac-3529-481b-be4e-5dfed2297651";

async function testAPI() {
  try {
    console.log("Testing API endpoint for GUID:", guid);

    const response = await fetch(`http://localhost:3000/api/messages/${guid}`);
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    const text = await response.text();
    console.log("Raw response text:", text);

    let data;
    try {
      data = JSON.parse(text);
      console.log("Parsed response data:", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return;
    }

    if (data.messages) {
      console.log("Number of messages:", data.messages.length);
      data.messages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, {
          role: msg.role,
          content: msg.content.substring(0, 50) + "...",
        });
      });
    }
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testAPI();
