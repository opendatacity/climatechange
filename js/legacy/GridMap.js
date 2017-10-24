/**
 * Created by Henrik Eliasson on 2016-04-01.
 *
 * LEGACY SCRIPT.
 * 
 * Climate forecast data on map visualization.
 */
$(function () {
    "use strict";

    var THRESHOLDS = [6, 12, 18, 24]; //tweak here for temperature thresholds (needs to be one less than color.length below) TODO make functions accept unknown size of THRESHOLDS
    var COLORS = ['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000']; //grid colors related to THRESHOLDS

    var map = null;
    var layerGroup = L.layerGroup();
    var dataPath = '../../data/unsorted/';
    var dataFiles = [
        '2020-01-19_MIROC-ESM_rcp45_germany.json',
        '2020-01-19_MIROC-ESM_rcp45.json',
        '2020-06-27_MIROC-ESM_rcp45_germany.json',
        '2020-06-27_MIROC-ESM_rcp45.json',
        '2020-01-19_MIROC-ESM_rcp85_germany.json',
        '2020-01-19_MIROC-ESM_rcp85.json',
        '2020-06-27_MIROC-ESM_rcp85_germany.json',
        '2020-06-27_MIROC-ESM_rcp85.json'];

    var pixelDataSet = null; //contains the JSON object loaded from file (dataFiles)
    var geoJsonData = null; //converted geoJSON data (from pixelDataSet)
    var categorizedPoints = null; //x-axis = category (first is lowest), y-axis = JSON objects (point data)

    var pixelCount = 0;
    var pixelTotal = 0;

    /**
     * tinfoil-hats on!
     */
    (function () {
        mapIni();
        dataComboIni();
    }());
    

    /**
     * Runs functions relating to the selection of a data model.
     * @param {bool} fullRender Decides whether to render only edges, or full model. False = only edges.
     * @param {String} dataURL Path to the data being processed
     */
    function processData(fullRender, dataURL) {
        reset();
        pixelDataSet = loadData(dataPath + dataURL);
        if (fullRender == false) {
            categorizedPoints = categorizeData(pixelDataSet, THRESHOLDS);
            generateCustomGrid(removePolygonInterior(categorizedPoints)); //categorizedPoints is a 2D array, inner arr contain all locations within a it's correlated index/threshold
        } else {
            //generateCustomGrid(pixelDataSet);
            generateGeoGrid();   //Uses converted geoJSON data instead
        }
        updateStats(document.getElementById("statsCombo"));
    }

    /**
     * Clears the grid on map and resets the counter (counting pixels rendered).
     */
    function reset() {
        layerGroup.clearLayers();
        pixelCount = 0;
    }

    /**
     * Uses the test sample generated from my python scripts
     */
    function loadPython() {
        reset();
        pixelDataSet = loadData("../output_data/find_edges.json"); //testing python generated json-file, only edge-points
        generateCustomGrid(pixelDataSet);
        updateStats(document.getElementById("statsCombo"));
    }

    /**
     * Layers a transparent image on top of the map.
     */
    function addImageLayer() {
        reset();
        var imagePath = '../img/__GENERATED__.png';
        var imageBounds = [[-90, 180], [90, -180]];
        
        var x = L.imageOverlay(imagePath, imageBounds);
        layerGroup.addLayer(x);
        layerGroup.addTo(map);
        x.setOpacity(0.5);
        updateStats(document.getElementById("statsCombo"));
    }

    /**
     * Iterates over JSON object and returns a sorted 2D array. Lower outer index relates to
     * lower average temperature objects. Inner arrays contain objects within their respective threshold.
     * @param {JSON} JSON JSON objects to iterate over
     * @param {Array} thresholds interval Values determining which category an object from data belongs to
     * @returns {Array|*}
     */
    function categorizeData(JSON, thresholds) {
        var category = get2DArray(thresholds.length + 1);
        for (var y = 0; y < JSON.length; y++) {
            var meanTemp = (JSON[y].tasmax + JSON[y].tasmin) / 2;
            var type = categorizeTemperature(meanTemp, thresholds);
            category[type].push(JSON[y]);
        }
        return category;
    }

    /**
     * Removes redundant internal points of a polygon.
     * @param {Array[][]} points Set of points (x & y) to trim
     * @returns {Array} Array only containing points that lay on the edge of the polygon
     */
    function removePolygonInterior(points) {
        var result = [];
        //Below nested loops attempts to check a pixel to see if any of the other pixels are right next to it.
        //Only considers pixels 0.25° lat or long away to be adjacent.
        for (var category = 0; category < points.length; category++) {
            for (var x = 0; x < points[category].length; x++) {
                var xPos = [points[category][x].lat, points[category][x].lon];
                var neighbours = 0;
                for (var y = 0; y < points[category].length; y++) {
                    var yPos = [points[category][y].lat, points[category][y].lon];
                    if (xPos[0] == yPos[0] - 0.25 && xPos[1] == yPos[1]) { //is there a neighbour above?
                        neighbours++;
                    }
                    if (xPos[0] == yPos[0] + 0.25 && xPos[1] == yPos[1]) { //below
                        neighbours++;
                    }
                    if (xPos[1] == yPos[1] - 0.25 && xPos[0] == yPos[0]) { //left
                        neighbours++;
                    }
                    if (xPos[1] == yPos[1] + 0.25 && xPos[0] == yPos[0]) { //right
                        neighbours++;
                    }
                }
                if (neighbours < 4) { //if this pixel has less than 4 similar neighbours we know its on the edge, and keep it.
                    result.push(points[category][x]);
                }
            }
        }
        return result;
    }

    /**
     * Populates statistics with selected data model.
     * @param {object} comboBox HTML <select> element to get selected dataset value from
     */
    function updateStats(comboBox) {
        document.getElementById("data_src").innerHTML = comboBox.options[comboBox.selectedIndex].text;
        document.getElementById("pixel_sum").innerHTML = pixelTotal;
        document.getElementById("pixel_cnt").innerHTML = pixelCount;
        document.getElementById("colors_cnt").innerHTML = COLORS.length;
        document.getElementById("temp_interval").innerHTML = THRESHOLDS.toString();
    }

    /**
     * Initialize map.
     */
    function mapIni() {
        var worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
        map = L.map('map_left', {
            center: [53.5753200, 10.0153400], //center on Hamburg
            maxBounds: worldBounds, //scrolling limits (snaps back if dragged outside)
            minZoom: 2,
            maxZoom: 11,
            zoom: 7
        });
        L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: ['otile1', 'otile2', 'otile3', 'otile4']
        }).addTo(map);
    }

    /**
     * Fills combobox used for selecting dataset.
     */
    function dataComboIni() {
        var combo = document.getElementById("statsCombo");
        for (var x = 0; x < dataFiles.length; x++) {
            var option = document.createElement("option");
            option.text = dataFiles[x];
            option.value = dataFiles[x];
            try {
                combo.add(option, null); //Standard
            } catch (error) {
                combo.add(option); // IE only
            }
        }
        $("#load_full").on("click", function () {
            processData(true, combo.options[combo.selectedIndex].text);
        });
        $("#load_edges").on("click", function () {
            processData(false, combo.options[combo.selectedIndex].text);
        });
        $("#load_image").on("click", function () {
            addImageLayer();
        });
        $("#load_python").on("click", function () {
            loadPython();
        });
    }

    /**
     * Retrieves data from JSON file to populate climate pixel-data.
     * @param {string} fileURL path to JSON-file
     * @return (JSON) Returns JSON object
     */
    function loadData(fileURL) {
        var temp = [];
        $.ajax({
            'async': false,
            'global': false,
            'url': fileURL,
            'dataType': "json",
            'success': function (refs) {
                temp = refs;
            }
        });
        return temp;
    }

    /**
     * Use GeoJSON geometries to add vector shapes.
     *
     * TODO CURRENTLY ADDS AND SUBTRACTS IN GeoJSON.JS (see MY EDIT)
     */
    function generateGeoGrid() {
        reset();
        geoJsonData = GeoJSON.parse(pixelDataSet, {
            Polygon: [
                ['lon', 'lat'],
                ['lon', 'lat'],
                ['lon', 'lat'],
                ['lon', 'lat']]
        });
        pixelDataSet = null; //TODO removes old data, though still stores both in memmory during conversion
        var geo = L.geoJson(geoJsonData, {
            //TODO STYLE AND OPTIONS
        });
        console.log(geoJsonData);
        layerGroup.addLayer(geo);
        layerGroup.addTo(map);
    }

    /**
     * Generate vector rectangles.
     */
    function generateCustomGrid(data) {
        for (var x = 0; x < data.length; x++) {
            var meanTemp = (data[x].tasmax + data[x].tasmin) / 2;
            var bounds = [
                [data[x].lon - 0.125, data[x].lat - 0.125],
                [data[x].lon + 0.125, data[x].lat + 0.125]];
            var vector = L.rectangle(bounds, {
                fillColor: COLORS[categorizeTemperature(meanTemp, THRESHOLDS)],
                fillOpacity: 0.5,
                stroke: false
            });
            layerGroup.addLayer(vector);
            pixelCount++;
        }
        layerGroup.addTo(map);
    }

    /**
     * Categorizes a temperature based on thresholds. Returns a value relating to which thresholds the
     * temperature is placed between. Return value 0 means the temperature is below the 1st threshold,
     * 1 means that it is placed between the 1st (includes equal) and 2nd threshold, and so forth.
     *
     * @param {number} temp Temperature to sort
     * @param {number[]} thresholds Interval markers that determine what category a temperature belongs to
     * @return (int) Returns a number relating to the temperatures category
     * TODO: parameter check not in place
     */
    function categorizeTemperature(temp, thresholds) {
        var result;
        if (temp < thresholds[0]) {
            result = 0;
        }
        else if (temp > thresholds[thresholds.length - 1]) {
            result = thresholds.length;
        }
        else {
            for (var x = 0; x < thresholds.length; x++) { //consider values in between min and max here
                if (temp >= thresholds[x] && temp < thresholds[x + 1]) {
                    result = x + 1;
                }
            }
        }
        return result;
    }

    /**
     * Generates an array of specified size, filled with empty arrays.
     * @param size Number of desired inner arrays
     * @returns {Array} 2D array of specified length
     */
    function get2DArray(size) {
        var arr = new Array(size);
        for (var x = 0; x < arr.length; x++) {
            arr[x] = [];
        }
        return arr;
    }
}(window.klima || (window.klima = {})));