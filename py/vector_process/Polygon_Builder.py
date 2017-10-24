class Polygon_Builder:
    """Finds exterior points, in order to draw polygons

    "lat" = 90 for top of world, and -90 for bottom
    "lon" = 180 for eastmost, and -180 for leftmost

    Example:

        [A]   [C]                 . . . .                  1   2   5   6
           [B][D] extrapolated -> .A. .C.                   [A]     [C]
                                    .B.D. corner order ->  12 3/11 4   7
                                                                [B] [D]
                                                               10  9   8

        start at A and find your way around; while grabbing all corners in correct order.

    MOVES contain possible coordinates for neighbours relative to current position. 45° increment/interval.
        KEY = direction used to determine which move was previously used to get where we are now.
        MOVES[0 & 1] = coordinate increments.
        MOVES[2] = next move, clockwise direction (for looping purposes).
        MOVES[3] = where to start looking, always 2 steps behind key.
    """
    MOVES = {"↑": (0.25, 0, "↗", "←"),
             "↗": (0.25, 0.25, "→", "↖"),
             "→": (0, 0.25, "↘", "↑"),
             "↘": (-0.25, 0.25, "↓", "↗"),
             "↓": (-0.25, 0, "↙", "→"),
             "↙": (-0.25, -0.25, "←", "↘"),
             "←": (0, -0.25, "↖", "↓"),
             "↖": (0.25, -0.25, "↑", "↙")}

    def extrapolate_all_edges(self, categorizedData):
        """Extrapolates all points to produce their 4 corners, then return a set of these new points.

        Keyword arguments:
            categorizedData -- list of points, all of same category
        """
        vertexes = []
        for edge in categorizedData:
            coords = [(edge["lat"] + 0.125, edge["lon"] + 0.125),
                      (edge["lat"] - 0.125, edge["lon"] + 0.125),
                      (edge["lat"] + 0.125, edge["lon"] - 0.125),
                      (edge["lat"] - 0.125, edge["lon"] - 0.125)]
            for pos in coords:
                vertexes.append(pos)
        return vertexes

    def extrapolate_edge(self, edge):
        """Extrapolates all corners for a single point, returns a list with tuples for each location.
        Return list contain following the order: [topleft, topright, bottomright, bottomleft]

        Keyword arguments:
            point -- single location to extrapolate
        """
        coords = [(edge["lat"] + 0.125, edge["lon"] - 0.125),
                  (edge["lat"] + 0.125, edge["lon"] + 0.125),
                  (edge["lat"] - 0.125, edge["lon"] + 0.125),
                  (edge["lat"] - 0.125, edge["lon"] - 0.125)]
        return coords

    def find_top_left(self, edges):
        """Find top and then leftmost point, in an unordered list of points. Return said topleft point.
        returns None if the incoming list is empty.

        Keyword arguments:
            points -- iterable to search in
        """
        topLeft = None
        if len(edges) > 0:
            topLeft = edges[0]
            for xPoint in edges:
                if xPoint["lat"] > topLeft["lat"]:
                    topLeft = xPoint
                elif xPoint["lat"] == topLeft["lat"]:
                    if xPoint["lon"] < topLeft["lon"]:
                        topLeft = xPoint
        return topLeft

    def find_next_neighbour(self, currentEdge, edges, preMove):
        """Find where next neighbour is and return it along with the direction used to get there.

        If currentEdge is an island, return currentEdge and None as direction.

        Keyword arguments:
            currentEdge -- The current edge to find a neighbour to
            edges -- iterable of edges to find neighbour in
            preMove -- Movement that led to current edge.
        """
        neighbours = self.find_neighbours(currentEdge, edges)
        searchAt = self.MOVES[preMove][3]
        for i in range(8):
            checkPos = [currentEdge["lat"] + self.MOVES[searchAt][0],
                        currentEdge["lon"] + self.MOVES[searchAt][1]]
            for possibleEdge in neighbours:  # TODO test with edges to see if there is a difference
                if possibleEdge["lat"] == checkPos[0] and possibleEdge["lon"] == checkPos[1]:
                    return possibleEdge, searchAt
            searchAt = self.MOVES[searchAt][2]
        print("ISLAND POINT")  # if we reach this, it means that currentEdge is a single point "island"
        return currentEdge, None

    def find_neighbours(self, currentEdge, edges):
        """Find all neighbouring edges to the current one

        Keyword arguments:
            currentEdge -- edge to find neighbours to
            edges -- iterable of edges to find neighbours in
        """
        neighbours = []
        currentPos = [currentEdge["lat"], currentEdge["lon"]]
        for edge in edges:
            pos = [edge["lat"], edge["lon"]]
            for move in self.MOVES.items():
                neighbour = [currentPos[0] + move[1][0],
                             currentPos[1] + move[1][1]]
                if neighbour == pos:
                    neighbours.append(edge)
        return neighbours

    def trace_shapes(self, edges):
        """Step through all points to divide data into complete individual polygons.

        Feed one category per iteration to this function."""
        # TODO finish breaking out extrapolation and collection into functions below
        polygonVertexes = []
        while len(edges) != 0:  # Trace one polygon at a time, and remove it from the list as it's stored to the shapes
            start = self.find_top_left(edges)
            current = start
            next = None
            preMove = "→"
            nextMove = None
            while next != start:
                next, nextMove = self.find_next_neighbour(start, edges, preMove)
                self.collect_vertexes(preMove, current, nextMove)
                current = next
                preMove = nextMove
            edges.remove(start)

    def collect_vertexes(self, preMove, currentEdge, nextMove):
        """Determines which extrapolated corners are relevant to retrieve, and in which order

        Keyword arguments:
            preMove -- direction used to get to current.
            currentEdge -- Edge from which we will collect corners from.
            nextMove -- direction point to where we move next time where a neighbour was found.
        """
        # TODO complete this
        count = 0
        preMove = self.MOVES[self.MOVES[preMove][3]][3]  # getting opposite direction
        move = None
        while True:
            count += 1
            move = self.MOVES[preMove][2]
            if move == nextMove:
                if count <= 2:
                    print("get 1 corner")
                elif count <= 4:
                    print("get 2 corners")
                elif count <= 6:
                    print("get 3 corners")
                else:
                    print("shouldn't happen")
                break  # stop looping since we found our destination

    def add_corner(self):
        """add n corners depending on where we looked"""
        # TODO complete this
        pass
