document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Force a fresh response to avoid stale cached results in some browsers
      const response = await fetch("/activities", { cache: "no-cache" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants:</strong></p>
            ${
              details.participants.length > 0
                ? `<ul class="participants-list">
                    ${details.participants.map(p => `
                      <li class="participant-item">
                        <span class="participant-email">${p}</span>
                        <button class="participant-remove" data-email="${p}" title="Remove participant">×</button>
                      </li>`).join("")}
                  </ul>`
                : `<p class="info small">No participants yet</p>`
            }
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Attach handlers for remove buttons inside this card
        const removeButtons = activityCard.querySelectorAll(".participant-remove");
        removeButtons.forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const email = btn.dataset.email;
            if (!email) return;

            const confirmed = confirm(`Unregister ${email} from ${name}?`);
            if (!confirmed) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              const json = await res.json();
                if (res.ok) {
                messageDiv.textContent = json.message;
                messageDiv.className = "success";
                // Refresh activities to reflect the change
                await fetchActivities();
              } else {
                messageDiv.textContent = json.detail || "Failed to remove participant";
                messageDiv.className = "error";
              }
            } catch (err) {
              messageDiv.textContent = "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              console.error("Error removing participant:", err);
            }

            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
  // Refresh activities so the UI shows the newly signed up participant
  await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
