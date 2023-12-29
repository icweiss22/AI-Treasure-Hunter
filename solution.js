var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Stacker = /** @class */ (function () {
    function Stacker() {
        // Constants representing different cell types
        this.EMPTY = 0;
        this.WALL = 1;
        this.BLOCK = 2;
        this.GOLD = 3;
        // Agent starts not carrying a block and at level 0 (ground level)
        this.carryingBlock = false;
        this.currentLevel = 0;
        this.currentPos = {
            x: null,
            y: null,
        };
        this.goldPos = {
            x: -1,
            y: -1,
            type: -1,
        };
    }
    // Utility functions
    Stacker.prototype.isOneLevelAboveOrBelow = function (cellA, cellB) {
        return Math.abs(cellA.level - cellB.level) === 1;
    };
    Stacker.prototype.isSameLevel = function (cellA, cellB) {
        return cellA.level === cellB.level;
    };
    // Basic pathfinding function (A* algorithm)
    Stacker.prototype.findPathToTarget = function (start, goal, gameMap) {
        var _a;
        // Create nodes
        var MyNode = /** @class */ (function () {
            function MyNode(parent, position) {
                this.g = 0; // Cost from start to current node
                this.h = 0; // Heuristic cost from current node to goal
                this.f = 0; // Total cost
                this.parent = parent;
                this.position = position;
            }
            return MyNode;
        }());
        // Calculate heuristic (Manhattan distance)
        function heuristic(pos1, pos2) {
            return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
        }
        // Initialize start and goal nodes
        var startNode = new MyNode(null, start);
        var goalNode = new MyNode(null, goal);
        // Initialize open and closed lists
        var openList = [];
        var closedList = new Set();
        // Add the start node
        openList.push(startNode);
        var _loop_1 = function () {
            // Get the current node (node with the lowest f value)
            var currentNode = openList.reduce(function (prev, curr) {
                return prev.f < curr.f ? prev : curr;
            });
            // Remove the current node and add it to the closed list
            openList = openList.filter(function (item) { return item !== currentNode; });
            closedList.add("".concat(currentNode.position.x, ",").concat(currentNode.position.y));
            // Check if we reached the goal
            if (currentNode.position.x === goalNode.position.x &&
                currentNode.position.y === goalNode.position.y) {
                // Reconstruct path from goal to start by following parent nodes
                var path = [];
                var current = currentNode;
                while (current) {
                    path.unshift(current.position);
                    current = (_a = current.parent) !== null && _a !== void 0 ? _a : new MyNode(null, start);
                }
                return { value: path };
            }
            // Generate children (up, down, left, right)
            var directions = [
                { x: 0, y: -1 }, // up
                { x: -1, y: 0 }, // left
                { x: 1, y: 0 }, // right
                { x: 0, y: 1 }, // down
            ];
            var _loop_2 = function (dir) {
                var nodePosition = {
                    x: currentNode.position.x + dir.x,
                    y: currentNode.position.y + dir.y,
                };
                // Make sure within range
                if (nodePosition.x > gameMap.length - 1 ||
                    nodePosition.x < 0 ||
                    nodePosition.y > gameMap[0].length - 1 ||
                    nodePosition.y < 0)
                    return "continue";
                // Make sure walkable terrain
                if (gameMap[nodePosition.y][nodePosition.x] === this_1.WALL)
                    return "continue";
                // Create new node
                var newNode = new MyNode(currentNode, nodePosition);
                // Check if the node is already in the closed list
                if (closedList.has("".concat(newNode.position.x, ",").concat(newNode.position.y)))
                    return "continue";
                // Calculate costs
                newNode.g = currentNode.g + 1;
                newNode.h = heuristic(newNode.position, goalNode.position);
                newNode.f = newNode.g + newNode.h;
                // Check if a node with the same position is in the open list with a lower f
                if (openList.some(function (node) {
                    return node.position.x === newNode.position.x &&
                        node.position.y === newNode.position.y &&
                        node.f < newNode.f;
                }))
                    return "continue";
                // Add the child to the open list
                openList.push(newNode);
            };
            for (var _i = 0, directions_1 = directions; _i < directions_1.length; _i++) {
                var dir = directions_1[_i];
                _loop_2(dir);
            }
        };
        var this_1 = this;
        // Loop until the open list is empty
        while (openList.length > 0) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object")
                return state_1.value;
        }
        // Return empty path if there is no path to the goal
        return [];
    };
    // Function to determine if the goal is visible from the current position
    Stacker.prototype.canSeeGoalFrom = function (currentPos, gameMap) {
        // Checks if a straight line can be drawn from currentPos to goldPos without hitting a wall
        function isClearPath(start, end) {
            var dx = end.x - start.x;
            var dy = end.y - start.y;
            var nx = Math.abs(dx);
            var ny = Math.abs(dy);
            var sign_x = dx > 0 ? 1 : -1;
            var sign_y = dy > 0 ? 1 : -1;
            var p = { x: start.x, y: start.y };
            for (var ix = 0, iy = 0; ix < nx || iy < ny;) {
                if ((0.5 + ix) / nx === (0.5 + iy) / ny) {
                    // Next step is diagonal
                    p.x += sign_x;
                    p.y += sign_y;
                    ix++;
                    iy++;
                }
                else if ((0.5 + ix) / nx < (0.5 + iy) / ny) {
                    // Next step is horizontal
                    p.x += sign_x;
                    ix++;
                }
                else {
                    // Next step is vertical
                    p.y += sign_y;
                    iy++;
                }
                if (gameMap[p.y][p.x] === this.WALL) {
                    return false; // Obstacle in the path
                }
            }
            return true; // No obstacles in the path
        }
        return isClearPath(currentPos, this.goldPos);
    };
    // Function to update the agent's knowledge of the gold's position
    Stacker.prototype.updateGoldPosition = function (currentPos, gameMap) {
        // Assuming we have a certain visibility range
        var visibilityRange = 5;
        for (var y = Math.max(0, currentPos.y - visibilityRange); y <= Math.min(gameMap.length - 1, currentPos.y + visibilityRange); y++) {
            for (var x = Math.max(0, currentPos.x - visibilityRange); x <= Math.min(gameMap[0].length - 1, currentPos.x + visibilityRange); x++) {
                // Check if we found the gold within the visibility range
                if (gameMap[y][x] === this.GOLD) {
                    this.goldPos = { x: x, y: y, type: -1 }; // Update the gold position
                    return;
                }
            }
        }
    };
    Stacker.prototype.decideNextMove = function (cell, gameMap) {
        var _a, _b, _c, _d, _e, _f;
        // Check if carrying a block and the gold position is unknown
        if (!this.carryingBlock &&
            this.goldPos.x === -1 &&
            this.goldPos.y === -1 &&
            !this.currentPos) {
            return this.explore(gameMap, this.currentPos);
        }
        // Logic when carrying a block
        if (this.carryingBlock) {
            // Check if the agent is next to the goal and can drop the block to reach the gold
            if (this.currentPos.x &&
                this.currentPos.y &&
                Math.abs(this.currentPos.x - this.goldPos.x) <= 1 &&
                Math.abs(this.currentPos.y - this.goldPos.y) <= 1) {
                if (this.currentLevel + 1 === this.goldPos.type) {
                    this.carryingBlock = false; // Drop the block to reach the gold
                    return "drop";
                }
            }
            var pathToDropLocation;
            this.currentPos.x = (_a = this.currentPos.x) !== null && _a !== void 0 ? _a : 0;
            this.currentPos.y = (_b = this.currentPos.y) !== null && _b !== void 0 ? _b : 0;
            var notNullCurrentPosition = { x: (_c = this.currentPos) === null || _c === void 0 ? void 0 : _c.x, y: (_d = this.currentPos) === null || _d === void 0 ? void 0 : _d.y };
            if (((_e = this.currentPos) === null || _e === void 0 ? void 0 : _e.x) && ((_f = this.currentPos) === null || _f === void 0 ? void 0 : _f.y)) {
                // Calculate the path to the drop location
                pathToDropLocation = this.findPathToDropLocation(notNullCurrentPosition, // Pass currentPos as the first argument
                this.goldPos, // Pass goldPos as the second argument
                gameMap // Pass gameMap as the third argument
                );
            }
            // Get the next move from the path or use "up" as a default fallback move
            if (this.currentPos && this.currentPos.x && this.currentPos.y) {
                return this.getNextMoveFromPath(pathToDropLocation, {
                    x: this.currentPos.x,
                    y: this.currentPos.y,
                });
            }
            else {
                return "up";
            }
        }
        // Logic for when not carrying a block
        if (this.shouldPickupBlock(cell)) {
            // Check if there's a block to pickup
            this.carryingBlock = true;
            return "pickup";
        }
        // If no blocks are immediately adjacent at the same level,
        // consider moving towards a nearby block or exploring
        return "up"; // Example default move
    };
    // Helper function to find the path to the best drop location
    Stacker.prototype.findPathToDropLocation = function (currentPos, goldPos, gameMap) {
        var path = [];
        var current = __assign({}, currentPos);
        while (current.x !== goldPos.x || current.y !== goldPos.y) {
            if (current.x < goldPos.x) {
                current = { x: current.x + 1, y: current.y };
            }
            else if (current.x > goldPos.x) {
                current = { x: current.x - 1, y: current.y };
            }
            else if (current.y < goldPos.y) {
                current = { x: current.x, y: current.y + 1 };
            }
            else if (current.y > goldPos.y) {
                current = { x: current.x, y: current.y - 1 };
            }
            path.push(__assign({}, current));
        }
        return path;
    };
    // Translates the next step in a path to a move action
    Stacker.prototype.getNextMoveFromPath = function (pathToTarget, currentPos) {
        if (pathToTarget && pathToTarget.length > 0) {
            var nextStep = pathToTarget[0];
            if (nextStep.x > currentPos.x)
                return "right";
            if (nextStep.x < currentPos.x)
                return "left";
            if (nextStep.y > currentPos.y)
                return "down";
            if (nextStep.y < currentPos.y)
                return "up";
        }
        return "up"; // Default or fallback move
    };
    // Helper function to check if the agent should pickup a block
    Stacker.prototype.shouldPickupBlock = function (cell) {
        // Check if there's a block to pickup at the current position
        return ((cell.left.type === this.BLOCK &&
            cell.left.level === this.currentLevel) ||
            (cell.right.type === this.BLOCK &&
                cell.right.level === this.currentLevel) ||
            (cell.up.type === this.BLOCK && cell.up.level === this.currentLevel) ||
            (cell.down.type === this.BLOCK && cell.down.level === this.currentLevel));
    };
    Stacker.prototype.explore = function (gameMap, currentPos) {
        var _this = this;
        // Example: Move in a random direction that is not a wall
        var directions = [
            { move: "left", x: -1, y: 0 },
            { move: "right", x: 1, y: 0 },
            { move: "up", x: 0, y: -1 },
            { move: "down", x: 0, y: 1 },
        ];
        var validMoves = directions.filter(function (dir) {
            var newX = currentPos.x + dir.x;
            var newY = currentPos.y + dir.y;
            return (newX >= 0 &&
                newX < gameMap[0].length &&
                newY >= 0 &&
                newY < gameMap.length &&
                gameMap[newY][newX] !== _this.WALL);
        });
        if (validMoves.length > 0) {
            // Randomly choose a valid move
            return validMoves[Math.floor(Math.random() * validMoves.length)].move;
        }
        return "up"; // Fallback if no valid moves are found
    };
    // The turn function that the game calls every cycle
    Stacker.prototype.turn = function (cell, gameMap) {
        // If currentPos is not set, infer the starting position
        if (this.currentPos.x === null || this.currentPos.y === null) {
            this.inferStartingPosition(cell, gameMap);
        }
        else {
            // Update the current position if it's explicitly provided
            // Remove these lines if the position needs to be inferred every turn
            this.currentPos = { x: cell.x, y: cell.y };
        }
        // Update the current level from the cell information
        this.currentLevel = cell.level;
        // Decide the next move based on the current cell and the game map
        var nextMove = this.decideNextMove(cell, gameMap);
        // Execute the next move
        return nextMove;
    };
    // Function for finding current starting position
    Stacker.prototype.inferStartingPosition = function (cell, gameMap) {
        // Example: Look for a unique pattern or a specific feature in the map that indicates the starting position
        for (var y = 0; y < gameMap.length; y++) {
            for (var x = 0; x < gameMap[y].length; x++) {
                // Check if the cell at (x, y) matches a pattern or feature that we know is near the starting position
                if (this.matchesStartingPattern(x, y, gameMap, cell)) {
                    this.currentPos.x = x;
                    this.currentPos.y = y;
                    return;
                }
            }
        }
        // Fallback: Set to default or handle as an error if no starting position can be inferred
        this.currentPos.x = 0; // Default value
        this.currentPos.y = 0; // Default value
    };
    Stacker.prototype.matchesStartingPattern = function (x, y, gameMap, cell) {
        if (gameMap[y][x] === this.EMPTY) {
            if (gameMap[y + 1][x] === this.WALL && cell.down.type === this.WALL) {
                return true;
            }
        }
        return false;
    };
    return Stacker;
}());
