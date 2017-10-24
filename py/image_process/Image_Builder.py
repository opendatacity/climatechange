import traceback


class Image_Builder:
    """Builds an image out of NASA's climte projection data"""

    def __init__(self, image):
        self.IMAGE = image
        self.PIXELS = self.IMAGE.load()

    def getCategory(self, value, intervals):
        """Generates a category number depending on a value and a set of intervals.
        Returns a value corresponding to a category between two intervals; 0 means
        the category is below the first interval, 1 means the value is between the
        1st (includes equal) and 2nd interval

        Keyword arguments:
            value -- A value to categorize
            intervals -- A list of intervals to base category on
        """
        result = None
        if value < intervals[0]:
            result = 0
        elif value > intervals[len(intervals) - 1]:
            result = len(intervals)
        else:
            for x in range(0, len(intervals)):
                if intervals[x] <= value < intervals[x + 1]:
                    result = x + 1
                    break
        return result

    def addPixel(self, rgbColor, pos):
        """Adds a pixel to the image at position.

        Keyword arguments:
            rgbColor -- list size 3, with each RGB value respectively.
            pos -- x, y coordinate for pixel. Starts at top left corner.
        """
        self.PIXELS[pos[0], pos[1]] = (rgbColor[0], rgbColor[1], rgbColor[2])

    def buildImage(self, json, dims, thresholds, colors):
        """Generates content for a image based on specific json structure.
        Each item has to have a "tasmin" and "tasmax" key to generate average
        from. The items also need to be in order by longitude (all same lon
        in a row, then next incremental lon)

        This method draws pixels from mid bottom, left to right (-90, 0) to (-90, 180);
        Then it draws from mid, right to left (-90, -1) to (-90, -180).

        Returns the image built from data

        Keyword arguments:
            json -- Data to extract position and color from
            dims -- tuple of x and y size for data
            thresholds -- thresholds to determine color from (related to colors)
            colors -- colors to chose from (related to thresholds)
        """
        pos = [dims[0] / 2, dims[1] - 1]  # data has items starting at bottom middle, looping eastwards
        row = 0  # counter indicating when to switch over to paint next row
        try:
            for i in range(0, len(json)):
                if json[i]["tasmax"] is None or json[i]["tasmin"] is None:
                    self.addPixel([0, 0, 0], pos)  # Black
                else:
                    avg = (json[i]["tasmin"] + json[i]["tasmax"]) / 2
                    category = self.getCategory(avg, thresholds)
                    self.addPixel(colors[category], pos)
                # setupWiring next position to draw at
                if row == dims[0] - 1:
                    row = 0
                    pos[1] -= 1
                elif row == dims[0] / 2 - 1:
                    row += 1
                    pos[0] = 0
                else:
                    row += 1
                    pos[0] += 1
        except IndexError:
            print(traceback.print_exc())
            print(pos)
        return self.IMAGE
