/**
 * Created by George on 2016-05-18.
 */
$(function () {
	"use strict";

	$(document.body).show(); //body is not shown until here, because it's jumping around until css and javascript is ready.

	var MARKERS_PATH = 'data/capitols_europe.json';

	var TEMPERATURE_PATH = 'data/legacy/dec_summers/';
	var RCP45_TASMAX_BIG = [ //TODO currently unused. Remove when new data set is available.
		"2020-06-27_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2030-06-28_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2040-06-27_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2050-06-28_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2060-06-27_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2070-06-28_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2080-06-27_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json",
		"2090-06-28_MIROC-ESM_rcp45_europe-big_tasmax_isotherms_geojson.json"];
	var RCP85_TASMAX_BIG = [
		"2020-06-27_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2030-06-28_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2040-06-27_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2050-06-28_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2060-06-27_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2070-06-28_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2080-06-27_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json",
		"2090-06-28_MIROC-ESM_rcp85_europe-big_tasmax_isotherms_geojson.json"];

	//TODO handle color generation programmatically, instead of getting them from geojson and here as two separate ways.
	var MAP_COLORS = ["#FDF9F7", "#F9EBE4", "#F8DBCE", "#F8C8B9", "#F7B6A7", "#F2A199", "#E29193", "#CF8789", "#B07D82", "#927072"]; //used by legend.
	var LABELS = ["0°C", "20°C", "40°C"]; //used by legend.
	var BOUNDS_DESKTOP = L.latLngBounds(L.latLng(31, -10.75), L.latLng(65, 38)); //limits to scrolling, the "hardness" is a map setting in mapIni.
	var DATA_RCP85 = loadData(TEMPERATURE_PATH, RCP85_TASMAX_BIG);
	var CAPITOLS = getData(MARKERS_PATH);
	var YEAR_LABELS = getDateLabels(RCP45_TASMAX_BIG);

	var LAYERS85 = populateLayerGroup(DATA_RCP85); //Heatmap geojson layers, ordered as it's fed.
	var MARKERS = createMarkers(CAPITOLS, "Europe"); //Markers are sitting on all spatial and temporal information regarding it's location.
	var MAP = mapIni("map", BOUNDS_DESKTOP);

	var INFO_ACTIVE = false; //used by datebuttons to determine whether content is added or not when clicked, also used to determin is info is shown or not for mobile use when panel is minimized.
	var PREVIOUS_INDEX = null; //used by datebuttons to keep track of which button to reset when a new one is pressed
	var PREVIOUS_MARKER = null; //used by datebuttons to update infopanel correctly
	var PREVIOUS_DATE = null; //used by location markers to rebuild with correct date

	/**
	 * Application setup.
	 */
	overlayIni();
	dateButtonsIni();
	createLegend(MAP_COLORS, LABELS);
	updateLayers(0);
	minimizeInfo();
	refreshMap(); //initial (jquery heavy) fix for responsive design.

	MAP.flyTo([47.5, 10.31], 5, {duration: 2, maxZoom: 5});

	/**
	 * Switches to a given temperature/date layer.
	 *
	 * @param index {int} A value corresponding to a layer (0 is first and
	 * earliest date if layers are loaded in the order they appear at the top).
	 */
	function updateLayers(index) {
		PREVIOUS_INDEX = growDateButton(index, PREVIOUS_INDEX);
		displayLayer(index, LAYERS85, MARKERS, MAP);
	}

	/**
	 * Refresh map fixes viewport changes and makes sure the map fills out the whole screen.
	 * Takes care of overlay fonts as well.
	 *
	 * TODO reduce jquery requests.
	 */
	function refreshMap() {
		var dims = $(window)[0];
		if (dims.innerWidth < 640) { 			//mobile settings
			$("#title_big").hide();
			$("#title_small").text("Summers of Europe").css("opacity", "0.9");
			$("#overlay_title")
				.css("font-size", "1.25rem");
			$(".overlay_text")
				.css("font-size", "0.75rem");
			$(".map_wrapper")
				.css("margin", "0 0")
				.css("width", dims.innerWidth)
				.css("height", dims.innerHeight);
			$("#left_panel").css({top: "4rem", left: "5px"});
			$("#locations_panel")
				.css({top: "", background: "rgba(255, 255, 255, 0.2)"});
			$("#legend_panel").css("background", "rgba(255, 255, 255, 0.2)");
			if (!INFO_ACTIVE) {
				$("#info_panel").hide();
			} else {
				$("#info_panel")
					.css({right: "7px", top: "25%"})
					.show();
			}
		}
		else {									 //desktop settings
			$("#title_big").show();
			$("#title_small").text("ummers of Europe").css("opacity", "1");
			$("#overlay_title")
				.css("font-size", "2.5rem");
			$(".overlay_text")
				.css("font-size", "1rem");
			$(".map_wrapper")
				.css("margin", "0 auto")
				.css("width", dims.innerWidth)
				.css("height", dims.innerHeight);
			$("#left_panel").css({top: "60%", left: "1rem"});
			$("#locations_panel")
				.css({top: "-15.5rem", background: "rgba(255, 255, 255, 0.5)"});
			$("#legend_panel").css("background", "rgba(255, 255, 255, 0.5)");
			if (INFO_ACTIVE) {
				$("#info_panel")
					.css({right: "4.5%", top: "30%"})
					.show();
			}
		}
	}

	/**
	 * Attempts to get json from file.
	 * @param {string} dataURL location to get file from.
	 * @return {json} file contents.
	 */
	function getData(dataURL) {
		var result = null;
		$.ajax({
			'async': false,
			'global': false,
			'url': dataURL,
			'dataType': "json",
			'success': function (refs) {
				result = refs;
			}
		});
		return result;
	}

	/**
	 * Populates climate projection slices into iterable collection.
	 * @param {Array<string>} fileNames files to request.
	 * @param {string} path URL up til fileNames.
	 * @return {Array<json>} List containing json data in sequence.
	 */
	function loadData(path, fileNames) {
		var list = [];
		for (var i = 0; i < fileNames.length; i++) {
			list.push(getData(path + fileNames[i]));
		}
		return list;
	}

	/**
	 * Filters out the year from filenames (first 4 characters in the string).
	 * @param {Array<string>} fileNames Array of strings, starting with years as 4 digits.
	 * @returns {Array<string>} Array with integers, ex. [2010, 2020, 2030, etc].
	 */
	function getDateLabels(fileNames) {
		var years = [];
		for (var i = 0; i < fileNames.length; i++) {
			years.push(parseInt(fileNames[i].substr(0, 4)));
		}
		return years;
	}

	/**
	 * Setup "i" button - disclaimer overlay events.
	 */
	function overlayIni() {
		$("#overlay_trigger").on("click", function (e) {
			$("#overlay_wrapper").toggle();
			$("#info_panel").toggle();
			$("#legend_panel").toggle();
			INFO_ACTIVE = !INFO_ACTIVE;
		});
		$("#overlay_wrapper").on("click", hideOverlay);

		function hideOverlay() {
			$("#overlay_wrapper").hide();
			$("#info_panel").show();
			$("#legend_panel").show();
			INFO_ACTIVE = true;
			createDisclaimer();
		}
	}

	/**
	 * Fills the overlay with information about the data set used
	 * along with reference attributions to those required.
	 * This setup overwrites the welcome text, which is intentional.
	 * You only see the welcome text once, when you arrive.
	 */
	function createDisclaimer() {
		$("#overlay_title")
			.text("Climate projections for Europe").css("color", "#777777");
		$("#overlay_text_top")
			.html("Created by " + '<a href="https://opendatacity.de/" style="text-decoration: none; color: #00e9ff">OpenDataCity</a>' + ", May 2016.");
		$("#overlay_text_bottom")
			.html("Visualization is based on climate prediction scenarios by NASA in the form of " + '<a href="https://nex.nasa.gov/nex/projects/1356/" style="text-decoration: none; color: #00e9ff">datasets</a>' + " open to the public domain. Both scenarios, RCP45 and RCP85, originate from the climate model MIROC ESM." + '<br><br>' +
				"Powered by " + '<a href="https://leafletjs.com/" style="text-decoration: none; color: #00e9ff">Leaflet</a>' + ", " + '<a href="https://cartodb.com/location-data-services/basemaps/" style="text-decoration: none; color: #00e9ff">CartoDB</a>' + " & " +
				'<a href="https://d3js.org/" style="text-decoration: none; color: #00e9ff">D3</a>' + " (Copyright 2010-2016 Mike Bostock - All rights reserved.)");
	}

	/**
	 * Setup wiring for thumbnail date selection at the bottom of the map.
	 */
	function dateButtonsIni() {
		var elements = "";
		for (var i = 0; i < YEAR_LABELS.length; i++) {
			elements += "<div " +
				"class='date_button' " +
				"data-year='" + YEAR_LABELS[i] + "' " +
				"id='" + i + "' ><p class='date_button_label' id='para_" + i + "'>" + YEAR_LABELS[i] + "</p></div>";
		}
		$("#date_wrapper").html(elements);

		for (var j = 0; j < YEAR_LABELS.length; j++) {
			$("#" + j + "").on("click", function (e) {
				updateLayers(e.target.id);
				PREVIOUS_DATE = e.target.attributes[1].value;
				PREVIOUS_INDEX = growDateButton(e.target.id, PREVIOUS_INDEX);
				if (INFO_ACTIVE) {
					triggerInfoPanel(PREVIOUS_MARKER);
				}
			});
		}
		PREVIOUS_DATE = YEAR_LABELS[0];
	}

	/**
	 * Inside "if"-statement is code to reset button to smaller size, and below the actual growth.
	 * Keeps track of previous selected button to revert it to original shape.
	 * @param next {int} index of button that was clicked (correlates to index of temperature layer).
	 * @param prev {int || null} index of button to revert style of (correlates to index of temperature layer).
	 * @return {int} index to set as the new previous index.
	 */
	function growDateButton(next, prev) {
		if (prev != null) {
			$("#" + prev + "")
				.css("width", "1.5rem")
				.css("height", "1.5rem")
				.css("pointer-events", "auto");
			$("#para_" + prev + "")
				.css("padding", "0.125em 0 0 0")
				.css("font-size", "0.8em")
				.css("color", "#000")
				.css("opacity", "0.5");
		}
		$("#" + next + "")
			.css("width", "4rem")
			.css("height", "4rem")
			.css("pointer-events", "none");
		$("#para_" + next + "")
			.css("padding", "0.125em 0 0 0")
			.css("font-size", "2.25em")
			.css("color", "#FFF")
			.css("opacity", "0.7");
		return next;
	}

	/**
	 * Initialize base map for climate comparison.
	 * @param stringID {string} HTML id selector for map container.
	 * @param bounds {L.LatLngBounds} Determines parameters for drag (map snaps back if dragged outside).
	 * @return {L.map} Return L.map.
	 */
	function mapIni(stringID, bounds) {
		var map = L.map(stringID, {
			center: [50.5, 10.31],
			renderer: L.svg({padding: 2}),
			maxBounds: bounds, //scrolling limits (snaps back if dragged outside)
			maxBoundsViscosity: 1.0,
			minZoom: 5,
			maxZoom: 5,
			zoom: 5,
			zoomControl: false,
			attributionControl: false
		}).on("dragstart", refreshMarkerLayer).on("click", refreshMarkerLayer);
		L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
		}).addTo(map);
		$(window).resize(refreshMap);
		return map;
	}

	/**
	 * Display a specific layer on a map, from a group of layers.
	 * @param index {int} Index for the layer to be shown (within it's L.layerGroup).
	 * @param middleLayers {L.layerGroup} layers to find and remove from map, to be displayed between tiles and markers.
	 * @param topLayers {L.layerGroup} markers to display at the top of the map as clickables.
	 * @param map {L.map} The map to show the layer on.
	 */
	function displayLayer(index, middleLayers, topLayers, map) {
		var middle = middleLayers.getLayers();
		var top = topLayers.getLayers();
		for (var i = 0; i < middle.length; i++) {
			map.removeLayer(middle[i]);
		}
		middle[index].addTo(map);
		for (i = 0; i < top.length; i++) {
			map.removeLayer(top[i]);
			map.addLayer(top[i]);
		}
	}

	/**
	 * Fixes markers being displayed in wrong position if a L.flyTo is interrupted.
	 */
	function refreshMarkerLayer() {
		var markers = MARKERS.getLayers();
		for (var i = 0; i < markers.length; i++) {
			markers[i].setLatLng(markers[i].getLatLng());
		}
	}

	/**
	 * Creates a Leaflet.layerGroup with custom layers.
	 * @param data {Array<json>} Geojson structured json.
	 * @return {L.layerGroup} Return L.layerGroup,
	 */
	function populateLayerGroup(data) {
		var layers = L.layerGroup();
		for (var i = 0; i < data.length; i++) {
			layers.addLayer(createTemperatureLayer(data[i]));
		}
		return layers;
	}

	/**
	 * Creates a new temperature layer for use with leaflet.map.
	 * @param data {json} Geojson structured json.
	 * @return {L.geoJson} Return layer with above functionality.
	 */
	function createTemperatureLayer(data) {
		return L.geoJson(data, {
			style: function (feature) {
				return {
					stroke: false,
					weight: 3,
					color: feature.properties.fill,
					opacity: 0.1,
					fillColor: feature.properties.fill,
					fillOpacity: 0.45
				};
			},
			onEachFeature: function (feature, layer) {
				layer.on("click", function (e) {
					/**    Uncomment for feature inspection. */
					//console.log(feature, feature.properties.fill, Math.round(feature.properties.tasmax_amax * 100) / 100 + "°C");
				});
			}
		});
	}

	/**
	 * Generates point locations from json data. Each Marker receives listeners.
	 *
	 * Used as points of interest connected with the info panel.
	 *
	 * Required json keys:
	 *    ContinentName
	 *    CountryName
	 *    CapitalLatitude
	 *    CapitalLongitude
	 *
	 * @param data {json} Collection of coordinates.
	 * @param continentFilter {string} Which continent to add from.
	 * @return {L.layerGroup} Returns all markers belonging to filter group.
	 */
	function createMarkers(data, continentFilter) {
		var markers = L.layerGroup();
		for (var i = 0; i < data.length; i++) {
			if (data[i].ContinentName == continentFilter) {
				var marker = L.circleMarker([data[i].CapitalLatitude, data[i].CapitalLongitude], {
					color: "#FFFFFF",
					fillOpacity: 0.4,
					fillColor: "#800008",
					weight: 2
				});
				marker.rcp_data = {"rcp45": data[i].rcp45, "rcp85": data[i].rcp85};
				marker.setRadius(5);
				marker.country = data[i].CountryName;
				marker.location = data[i].CapitalName;
				marker.on("click", function (e) {
					triggerInfoPanel(e.target);
				});
				marker.on("mouseover", function (e) {
					triggerMarkerHover(e.target);
				});
				markers.addLayer(marker);
			}
		}
		return markers;
	}

	/**
	 * Populates #info_panel and its charts based on data stored inside a marker.
	 * @param marker {L.marker} Specific marker to get all data from.
	 */
	function triggerInfoPanel(marker) {
		highlightMarker(marker);
		expandInfo(marker, PREVIOUS_DATE);
		createLineChart(getChartData(marker, 10));
		createCigaretteChart(getTemperature(marker, PREVIOUS_DATE, 1));
		PREVIOUS_MARKER = marker;
		refreshMap();
	}

	/**
	 * Update info_panel with properties from selected marker (city/location).
	 * Rebuilds html for the info panel.
	 * @param marker {L.marker} Location marker on map (containing data).
	 * @param date {string} Label to go with value, for context.
	 */
	function expandInfo(marker, date) {
		INFO_ACTIVE = true;
		$("#info_content").html(
			'<div id="info_location">' +
			'<h3 class="info_name">' + marker.location + '</h3>' +
			'<h2 id="info_country">' + marker.country + '</h2>' +
			'</div>' +
			'<button id="info_close">' + '&#10006' + '</button>' +
			'<div id="info_values">' +
			'<p id="info_temp">' + getTemperature(marker, date, 1).rcp85 + '°C</p>' +
			'<p id="info_temp_label">Summer average</p>' +
			'<p id="info_year">' + date + '</p>' +
			'<div id="chart_legend_desc_wrap">' +
			'<p>Climate projection</p>' +
			'<p>for worldwide CO2</p>' +
			'<p>emission scenarios.</p>' +
			'</div>' +
			'</div>');

		$("#info_close")
			.on("click", function (e) {
				minimizeInfo();
				normalizeMarker(PREVIOUS_MARKER);
				refreshMap();
			})
			.on("mouseover", function (e) {
				e.target.style.color = "#FFFFFF";
			})
			.on("mouseout", function (e) {
				e.target.style.color = "#777777"
			});
	}

	/**
	 * Collapses the info panel to it's basics, still visible.
	 * Rebuilds HTML for the info panel.
	 */
	function minimizeInfo() {
		INFO_ACTIVE = false;
		$("#info_content")
			.html(
				'<input class="info_name" id="info_select" placeholder="select a location">' +
				'<img id="info_search" src="resources/search_small.png">')
			.css("padding", "0 0 1.4rem");
		$("#line_chart").height(0); //NV.D3 don't like it if it's hidden.
		$("#cigarette_chart").html("").hide();
		$("#info_select")
			.on("focusout", function (e) {
				e.target.value = ""
			})
			.keypress(function (e) {
				if (e.keyCode == 13) {
					showLocation(e.target.value);
					e.target.value = "";
				}
			});
	}

	/**
	 * TODO add autocompletion to search bar as visible and selectable value.
	 * Search for a location by name from MARKERS and show it - if found. If it's not found, nothing happens.
	 * @param location {string} The name to search for.
	 */
	function showLocation(location) {
		var locations = MARKERS.getLayers();
		for (var i = 0; i < locations.length; i++) {
			var selection = (locations[i].location + " " + locations[i].country).toLowerCase();
			if (selection.indexOf(location.toLowerCase()) > -1) {
				triggerInfoPanel(locations[i]);
				break;
			}
		}
	}

	/**
	 * TODO when mouseposition works, implement popup that follow the cursor for quick info.
	 *
	 * Adds wobble effect to city markers on mouseover.
	 *
	 * @param marker {L.marker} Event properties.
	 */
	function triggerMarkerHover(marker) {
		if (PREVIOUS_MARKER === null || marker.location != PREVIOUS_MARKER.location) {
			marker.setRadius(7);
			setTimeout(function () {
				normalizeMarker(marker);
			}, 100);
		}
	}

	/**
	 * Highlights a clicked marker, and reverts the previous (if any).
	 * @param marker {L.marker} Marker to highlight.
	 */
	function highlightMarker(marker) {
		marker.setRadius(10);
		marker.setStyle({
			fillColor: "#00e9ff",
			fillOpacity: 0.6
		});
		if (PREVIOUS_MARKER !== null && marker.location != PREVIOUS_MARKER.location) {
			normalizeMarker(PREVIOUS_MARKER);
		}
	}

	function normalizeMarker(marker) {
		marker.setRadius(5);
		marker.setStyle({
			fillColor: "#800008",
			fillOpacity: 0.4
		})
	}

	/**
	 * Retrieves two temperatures based on a date, for both rcp scenarios.
	 * @param marker {L.marker.rcp_data} The specific marker to retrieve data from.
	 * @param year {string/number} Should be a 4 digit number or string.
	 * @param decimals {int} Number of decimals remaining (rounded up).
	 * @returns {{string:number, string:number}} First key is rpc45, second is rcp85.
	 */
	function getTemperature(marker, year, decimals) {
		var temp = {};
		for (var i = 0; i < marker.rcp_data.rcp45.length; i++) {
			if (marker.rcp_data.rcp45[i].year == year) {
				temp.rcp45 = Math.round(marker.rcp_data.rcp45[i].tasmean * Math.pow(10, decimals)) / Math.pow(10, decimals);
				temp.rcp85 = Math.round(marker.rcp_data.rcp85[i].tasmean * Math.pow(10, decimals)) / Math.pow(10, decimals);
				break;
			}
		}
		return temp
	}

	/**
	 * Creates a basic line chart.
	 * @param data {Array<nv.d3.object>} key value pairs used to plot chart (look at getChartData()).
	 */
	function createLineChart(data) {
		$("#info_panel").height("auto");
		nv.addGraph(function () {
			var chart = nv.models.lineChart()
				.useInteractiveGuideline(true)
				.showLegend(true)
				.showYAxis(true)
				.showXAxis(true);
			chart.interactiveLayer.tooltip.fixedTop(100);
			chart.xAxis
				.tickFormat(d3.format('r'));
			chart.yAxis
				.tickFormat(function (d) {
					return d.toFixed(1) + "°C";
				});

			updateChartData(data, chart);
			nv.utils.windowResize(function () {
				chart.update()
			});
			return chart;
		});
	}

	/**
	 * Creates a horizontal stacked bar chart, rcp85 temp is 100% of width, and rcp45 temp is a % of its width.
	 * @param data {{string:number, string:number}} Temperature contained by its key, rcp45 or rcp85.
	 */
	function createCigaretteChart(data) {
		var percent = Math.round((data.rcp45 / data.rcp85) * 1000) / 10;
		if (percent > 100) {
			percent = 100;
		}
		$("#cigarette_chart")
			.show()
			.html(
				'<p id="rcp_difference" style="left: ' + (percent - 105) + '%">' + Math.round((percent - 100) * 10) / -10 + '% milder</p>' +
				'<div class="rcp_bar" id="rcp85_bar">' +
				'<p class="rcp_values" id="rcp85_value">' + data.rcp85 + '°C</p>' +
				'</div>' +
				'<div class="rcp_bar" id="rcp45_bar" style="width: ' + percent + '%">' +
				'<p class="rcp_values" id="rcp45_value">' + data.rcp45 + '°C</p>' +
				'</div>' +
				'<p class="rcp_values" id="zero_value">' + 0 + '°C</p>'
			)
	}

	/**
	 * Fill chart with new data.
	 * @param data {Array<nv.d3.object>} key value pairs used to plot chart
	 * @param chart {nv.d3.lineChart} The chart which to add the data to.
	 */
	function updateChartData(data, chart) {
		$("#line_chart").height(100 + "%");
		d3.select('#line_chart')    //Select the <svg> element you want to render the chart in.
			.datum(data)			//Populate the <svg> element with chart data...
			.transition().duration(500)
			.call(chart);           //Finally, render the chart!
		d3.select(".nv-legendWrap")
			.attr("transform", "translate(10,-58)");
	}

	/**
	 * Replace below with generation of temperature from JSON locations.
	 * @param data {{string: json, string: json}} Keys should be "rcp45" and "rcp85".
	 * @param interval {int} Interval to add with index when fetching from data to limit results.
	 * @return {Array<nv.d3.object>}
	 */
	function getChartData(data, interval) {
		var rcp85 = [],
			rcp45 = [];

		//Data is represented as an array of {x,y} pairs. Collects temperature with a 10 year interval.
		for (var i = 0; i < data.rcp_data.rcp85.length; i = i + interval) {
			rcp85.push({x: data.rcp_data.rcp85[i].year, y: data.rcp_data.rcp85[i].tasmean});
			rcp45.push({x: data.rcp_data.rcp45[i].year, y: data.rcp_data.rcp45[i].tasmean});
		}

		//Line chart data should be sent as an array of series objects.
		return [
			{
				values: rcp85,      //values - represents the array of {x,y} data points
				key: 'Current trend', //key  - the name of the series.
				color: '#6f2418',  //color - optional: choose your own line color.
				strokeWidth: '5px'
			},
			{
				values: rcp45,
				key: '25% reduction',
				color: '#65BB07',
				strokeWidth: '5px'
			}
		];
	}

	/**
	 * Generate legend for map colors.
	 * @param colors {Array<string>} Colors used, first index is bottom. Length of colors is used to determine count.
	 * @param labelValues {Array<string>} Labels to stick next to a color, first index goes to the bottom.
	 */
	function createLegend(colors, labelValues) {
		for (var i = colors.length - 1; i >= 0; i--) {
			$("#legend_left").append("<div class='legend_colors' id='temperature_" + i + "' style='background: " + colors[i] + "'>&nbsp;</div>");
		}
		for (var j = labelValues.length - 1; j >= 0; j--) {
			$("#legend_right").append("<p class='legend_labels' id='label_" + j + "'>" + labelValues[j] + "</p>");
		}
	}
}(window.EuroKlima || (window.EuroKlima = {})));
