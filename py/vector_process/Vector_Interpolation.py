import ujson as json

class Vector_Interpolation:
    """Process NASA climate projection points to interpolate edge points"""

    def categorize_temperature(self, temp, thresholds):
        """Categorize a temperature depending on which thresholds it falls between.

        Keyword arguments:
            temp -- temperature to categorize based on thresholds
            thresholds -- thresholds to determine category
        """
        result = None
        if temp < thresholds[0]:
            result = 0
        elif temp > thresholds[len(thresholds) - 1]:
            result = len(thresholds)
        else:
            for i in range(0, len(thresholds)):
                if thresholds[i] <= temp < thresholds[i + 1]:
                    result = i + 1
                    break
        return result

    def sort_points(self, jsonObject, thresholds):
        """Place points into a respective sublist depending on its category and returns
        that 2D list.

        Keyword arguments:
            jsonObject -- loaded raw json with climate data
            thresholds -- thresholds to determine category
        """
        result = []
        for i in range(0, len(thresholds) + 1):
            result.append([])
        for point in jsonObject:
            if point["tasmax"] is not None or point["tasmin"] is not None:
                average = (point["tasmax"] + point["tasmin"]) / 2
                category = self.categorize_temperature(average, thresholds)
                result[category].append(point)
        return result

    def filter_edges(self, data):
        """Find which points out of a categorized list have neighbouring points in order
        to decide which points are on the edge.

        ALTERS DATA LIST!

        Returns a 2D list only containing edge points.

        Keyword arguments:
            data -- 2D list where each sub-list contain all points of a specific category
        """
        jsonDump = []
        for i in range(0, len(data)):
            temp = []
            for xPoint in data[i]:
                xPos = [xPoint["lat"],
                        xPoint["lon"]]  # lat = 90 for top and -90 for bottom, lon = -180 for left and 180 for right
                neighbours = 0
                count = 0
                for yPoint in data[i]:
                    count += 1
                    yPos = [yPoint["lat"], yPoint["lon"]]
                    if xPos[0] + 0.25 == yPos[0] and xPos[1] == yPos[1]:
                        neighbours += 1
                    if xPos[0] - 0.25 == yPos[0] and xPos[1] == yPos[1]:
                        neighbours += 1
                    if xPos[1] + 0.25 == yPos[1] and xPos[0] == yPos[0]:
                        neighbours += 1
                    if xPos[1] - 0.25 == yPos[1] and xPos[0] == yPos[0]:
                        neighbours += 1
                if neighbours < 4:
                    temp.append(xPoint)
                    jsonDump.append(xPoint)
            data[i] = temp
        with open('../output_data/find_edges.json', 'w') as outfile:
            json.dump(jsonDump, outfile)
        print("resulting total points in jsonDump :   ", len(jsonDump), "points")
