import time
import ujson as json
from PIL import Image
from research.py.image_process.Image_Builder import Image_Builder
from research.py.vector_process.Vector_Interpolation import Vector_Interpolation
from research.py.vector_process.Polygon_Builder import Polygon_Builder

PATH = "../data/unsorted/"
FILES = ["2020-06-27_MIROC-ESM_rcp85_germany.json"]
COLORS_HEX = ['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000']  # red gradient
COLORS_RGB_SMALL = [[254, 240, 217], [253, 204, 138], [252, 141, 89], [227, 74, 51], [179, 0, 0]]  # red gradient
COLORS_RGB = [[3, 83, 97], [5, 121, 141], [9, 186, 217], [91, 225, 249], [150, 252, 224], [218, 254, 251],  # blues
              [254, 240, 217], [253, 204, 138], [252, 141, 89], [227, 74, 51], [179, 0, 0], [145, 0, 0]]  # reds
COLORS_REDS = [[255, 250, 242], [254, 236, 205], [253, 204, 138], [252, 141, 89], [227, 74, 51], [179, 0, 0],
               [145, 0, 0]]
THRESHOLDS = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25]
THRESHOLDS_REDS = [0, 5, 10, 15, 20, 25]
THRESHOLDS_REDS_ALT = [-6, 0, 6, 12, 18, 24]
THRESHOLDS_SMALL = [6, 12, 18, 24]
SAMPLE_GERMANY = (35, 31)
WORLD = (1440, 720)
PROJECTION_EPSG = "3857"
OUT_FILE = "../img/__GENERATED__.png"

VI = Vector_Interpolation()
PB = Polygon_Builder()


def drawPNG():
    IB = Image_Builder(Image.new('RGB', WORLD, "GREEN"))
    image = IB.buildImage(json.load(data), WORLD, THRESHOLDS_REDS_ALT, COLORS_REDS)
    image.save(OUT_FILE)


def testSortAndStepping():
    a = VI.sort_points(json.load(data), THRESHOLDS_SMALL)
    print("points sorted into category        :   ", len(a[0]), len(a[1]), len(a[2]), len(a[3]), len(a[4]))
    VI.filter_edges(a)
    print("remaining edges after sort         :   ", len(a[0]), len(a[1]), len(a[2]), len(a[3]), len(a[4]))
    b = []
    for category in a:
        b.append(PB.extrapolate_all_edges(category))
    print("extrapolate corners results        :   ", len(b[0]), len(b[1]), len(b[2]), len(b[3]), len(b[4]))

    ###############################################------ Stepping
    c = None  # PB.find_top_left(a[3])
    if c is not None:
        print("top left point from a[x]           :   ", c["lat"], c["lon"])
        print("top left extrapolated              :   ", PB.extrapolate_edge(c))
        move = "→"
        count = 1
        d, move = PB.find_next_neighbour(c, a[3], move)
        print("Find next adjacent to current      :   ", d["lat"], d["lon"], " |  move used:", move, "        ", count)
        while c != d:  # create a polygon!
            count += 1
            d, move = PB.find_next_neighbour(d, a[3], move)
            print("Find next adjacent to current      :   ", d["lat"], d["lon"], " |  move used:", move, "        ",
                  count)
    # TODO testing below here to collect corners. Stepping around to find a whole polygon is complete.
    PB.trace_shapes(a[3])


############------ START ------#############
start_time = time.time()
with open(PATH + FILES[0]) as data:
    # drawPNG()
    testSortAndStepping()
print("--- %s seconds to complete ---" % (time.time() - start_time))
