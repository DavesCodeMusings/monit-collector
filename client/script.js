var collection = {}
refreshIntervalSec = null
refreshIntervalId = null

async function getCollection() {
  url = new URL("/collector", document.location).href
  console.debug("Fetching collection from:", url)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('Error fetching collection:', response.status)
    }

    collection = await response.json()
  }
  catch (error) {
    console.error(error.message)
  }

  populateTable()
}

function populateTable() {
  let collectionLastUpdate = new Date(collection.lastUpdate)
  const tbody = document.querySelector("tbody")
  tbody.replaceChildren()

  if (Object.keys(collection.hosts) == 0) {
    tbody.innerHTML = '<tr><td colspan="4"><i>Awaiting data...</i></td></tr>'
    suggestRefreshInterval(300)
  }
  else {
    hosts = Object.keys(collection.hosts).sort()
    hosts.forEach(hostId => {

      // Server link to get more detail.
      let hostMonit = collection.hosts[hostId].monit.server.httpd.address
        + ":"
        + collection.hosts[hostId].monit.server.httpd.port
      if (collection.hosts[hostId].monit.server.httpd.ssl) {
        hostMonit = "https://" + hostMonit
      }
      else {
        hostMonit = "http://" + hostMonit
      }

      // Monit's polling interval is used to tune the auto-refresh
      suggestRefreshInterval(collection.hosts[hostId].monit.server.poll / 2)

      // Summary of monitored service health
      services = collection.hosts[hostId].monit.services.service
      let svcHealthy = []
      let svcDegraded = []
      services.forEach(svc => {
        if (svc.status == 0) {
          svcHealthy.push(svc['@_name'])
        }
        else {
          svcDegraded.push(svc['@_name'])
          console.debug(svc['@_name'], svc.status)
        }
      })
      console.debug("Healthy services: ", svcHealthy)
      console.debug("Degraded services:", svcDegraded)
      healthyCount = svcHealthy.length
      degradedCount = svcDegraded.length

      // Freshness of data collected from server (num seconds old)
      let hostLastUpdate = new Date(collection.hosts[hostId].lastUpdate)
      let updateAge = Math.floor((collectionLastUpdate - hostLastUpdate) / 1000)
      let staleHost = (updateAge > 300)

      // Apply to template
      const template = document.querySelector("#table-row")
      const clone = template.content.cloneNode(true)
      let hostname = collection.hosts[hostId].monit.server.localhostname
      clone.querySelector("#hostname").innerHTML = `<a href="${hostMonit}" target="_new">${hostname}</a>`
      clone.querySelector("#healthy-count").innerHTML = `${healthyCount}`
      clone.querySelector("#degraded-count").innerHTML = `${degradedCount}`
      clone.querySelector("#details").innerHTML = hostLastUpdate.toLocaleDateString()
        + " "
        + hostLastUpdate.toLocaleTimeString()
      if (degradedCount > 0) {
        clone.querySelector("#host-id").classList.add("degraded")
          clone.querySelector("#details").innerHTML += "<br>"
          clone.querySelector("#details").innerHTML += `${svcDegraded.sort().join()}`
      }
      else {
        clone.querySelector("#host-id").classList.add("okay")
      }
      if (staleHost) {
        clone.querySelector("#host-id").classList.add("stale")
      }
      clone.querySelector("#host-id").id = `host-id-${hostId}`

      // id attributes must be unique for HTML to be valid
      clone.querySelector("#hostname").id = `hostname-${hostId}`
      clone.querySelector("#healthy-count").id = `healthy-count-${hostId}`
      clone.querySelector("#degraded-count").id = `degraded-count-${hostId}`
      clone.querySelector("#details").id = `details-${hostId}`
      tbody.appendChild(clone)
    })
  }
}

function suggestRefreshInterval(seconds) {
  if (!refreshIntervalSec || refreshIntervalSec > seconds) {
    refreshIntervalSec = seconds
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId)
    }
    refreshIntervalId = setInterval(getCollection, seconds * 1000)
    console.debug("Auto-refresh interval set to:", seconds)
  }
}
