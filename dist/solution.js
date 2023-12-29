"use strict";
class Stacker {
    // Constants representing different cell types
    EMPTY = 0;
    WALL = 1;
    BLOCK = 2;
    GOLD = 3;
    // Agent starts not carrying a block and at level 0 (ground level)
    carryingBlock = false;
    currentLevel = 0;
    currentPos = {
        x: 0,
        y: 0,
    };
    goldPos = {
        x: -1,
        y: -1,
        type: -1,
    };
    constructor(agentX, agentY) {
        // Use agentX and agentY as needed
        this.currentPos.x = agentX;
        this.currentPos.y = agentY;
    }
    findPathToTarget(start, goal, gameMap) {
        class MyNode {
            parent;
            position;
            g = 0; // Cost from start to current node
            h = 0; // Heuristic cost from current node to goal
            f = 0; // Total cost
            constructor(parent, position) {
                this.parent = parent;
                this.position = position;
            }
        }
        function heuristic(pos1, pos2) {
            return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
        }
        let startNode = new MyNode(null, start);
        let goalNode = new MyNode(null, goal);
        let openList = [];
        let closedList = new Set();
        openList.push(startNode);
        while (openList.length > 0) {
            let currentNode = openList.reduce((prev, curr) => prev.f < curr.f ? prev : curr);
            openList = openList.filter((item) => item !== currentNode);
            closedList.add(`${currentNode.position.x},${currentNode.position.y}`);
            if (currentNode.position.x === goalNode.position.x &&
                currentNode.position.y === goalNode.position.y) {
                let path = [];
                let current = currentNode;
                while (current) {
                    path.unshift(current.position);
                    current = current.parent;
                }
                return path;
            }
            let directions = [
                { x: 0, y: -1 }, // up
                { x: -1, y: 0 }, // left
                { x: 1, y: 0 }, // right
                { x: 0, y: 1 }, // down
            ];
            for (let dir of directions) {
                let nodePosition = {
                    x: currentNode.position.x + dir.x,
                    y: currentNode.position.y + dir.y,
                };
                if (nodePosition.x > gameMap.length - 1 ||
                    nodePosition.x < 0 ||
                    nodePosition.y > gameMap[0].length - 1 ||
                    nodePosition.y < 0)
                    continue;
                if (gameMap[nodePosition.y][nodePosition.x] === this.WALL)
                    continue;
                // Elevation check: Agent can move up or down by one level at a time
                if (Math.abs(gameMap[nodePosition.y][nodePosition.x] - gameMap[currentNode.position.y][currentNode.position.x]) > 1)
                    continue;
                let newNode = new MyNode(currentNode, nodePosition);
                if (closedList.has(`${newNode.position.x},${newNode.position.y}`))
                    continue;
                newNode.g = currentNode.g + 1;
                newNode.h = heuristic(newNode.position, goalNode.position);
                newNode.f = newNode.g + newNode.h;
                if (openList.some((node) => node.position.x === newNode.position.x &&
                    node.position.y === newNode.position.y &&
                    node.f < newNode.f))
                    continue;
                openList.push(newNode);
            }
        }
        return []; // Return an empty path if no path to the goal is found
    }
    isVisible(start, end, gameMap) {
        // Implementation of Bresenham's line-of-sight algorithm
        // Return true if there's a clear path from start to end without hitting a WALL
        let x0 = start.x;
        let y0 = start.y;
        let x1 = end.x;
        let y1 = end.y;
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        while (true) {
            // Check if the current tile is a wall
            if (gameMap[y0][x0] === this.WALL) {
                return false; // Obstacle encountered
            }
            if (x0 === x1 && y0 === y1) {
                break; // End point reached
            }
            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
        return true; // No obstacles in the path
    }
    updateGoldPosition(currentPos, gameMap) {
        const visibilityRange = 5;
        for (let y = Math.max(0, currentPos.y - visibilityRange); y <= Math.min(gameMap.length - 1, currentPos.y + visibilityRange); y++) {
            for (let x = Math.max(0, currentPos.x - visibilityRange); x <= Math.min(gameMap[0].length - 1, currentPos.x + visibilityRange); x++) {
                if (gameMap[y][x] === this.GOLD &&
                    this.isVisible(currentPos, { x, y }, gameMap)) {
                    this.goldPos = { x: x, y: y, type: -1 };
                    return;
                }
            }
        }
    }
    decideNextMove(cell, gameMap) {
        // Update the gold's position if it's within visibility range
        this.updateGoldPosition(this.currentPos, gameMap);
        // Case 1: If the gold's position is known and reachable
        if (this.goldPos.x !== -1 && this.goldPos.y !== -1) {
            // Check if the agent is next to the goal and can drop the block to reach the gold
            if (this.carryingBlock && this.isNextToGoal()) {
                // Drop the block if it enables reaching the gold
                return this.decideDropBlock();
            }
            // Pathfind to the gold's location
            let pathToGold = this.findPathToTarget(this.currentPos, this.goldPos, gameMap);
            // If there's a path and the agent is carrying a block
            if (pathToGold.length > 0 && this.carryingBlock) {
                return this.getNextMoveFromPath(pathToGold, this.currentPos);
            }
            // If there's a path but the agent isn't carrying a block, search for a block
            if (pathToGold.length > 0 && !this.carryingBlock) {
                return this.searchForBlock(cell, gameMap);
            }
        }
        // Case 2: If the gold's position is unknown or unreachable
        if (this.goldPos.x === -1 || !this.findPathToTarget(this.currentPos, this.goldPos, gameMap).length) {
            return this.explore(gameMap, this.currentPos);
        }
        // Fallback move
        return "up";
    }
    // Supporting functions used in decideNextMove
    isNextToGoal() {
        // Check if the agent is adjacent to the gold and at the correct level to drop a block
        return (Math.abs(this.currentPos.x - this.goldPos.x) <= 1 &&
            Math.abs(this.currentPos.y - this.goldPos.y) <= 1 &&
            this.currentLevel + 1 === this.goldPos.type // Assuming type indicates the level to reach the gold
        );
    }
    decideDropBlock() {
        if (this.isNextToGoal()) {
            this.carryingBlock = false;
            return "drop";
        }
        return "wait"; // Or some other default action if dropping the block is not beneficial
    }
    searchForBlock(cell, gameMap) {
        // Check if there's a block adjacent to pick up
        if (this.shouldPickupBlock(cell)) {
            return "pickup";
        }
        // If no block is immediately adjacent, find a path to the nearest block
        // Here you'll need to implement a method to find the nearest block
        let nearestBlockPos = this.findNearestBlock(gameMap);
        if (nearestBlockPos) {
            let pathToNearestBlock = this.findPathToTarget(this.currentPos, nearestBlockPos, gameMap);
            if (pathToNearestBlock.length > 0) {
                return this.getNextMoveFromPath(pathToNearestBlock, this.currentPos);
            }
        }
        return "wait"; // Fallback if no blocks are found
    }
    findNearestBlock(gameMap) {
        const directions = [
            { x: 1, y: 0 }, // right
            { x: -1, y: 0 }, // left
            { x: 0, y: 1 }, // down
            { x: 0, y: -1 } // up
        ];
        let queue = [{ x: this.currentPos.x, y: this.currentPos.y }];
        let visited = Array.from({ length: gameMap.length }, () => Array(gameMap[0].length).fill(false));
        while (queue.length > 0) {
            let { x, y } = queue.shift();
            // Check if the current position is a block
            if (gameMap[y][x] === this.BLOCK) {
                return { x, y };
            }
            // Add adjacent positions to the queue
            for (const dir of directions) {
                const nextX = x + dir.x;
                const nextY = y + dir.y;
                // Check boundaries and whether the position is already visited
                if (nextX >= 0 && nextX < gameMap[0].length &&
                    nextY >= 0 && nextY < gameMap.length &&
                    !visited[nextY][nextX] && gameMap[nextY][nextX] !== this.WALL) {
                    queue.push({ x: nextX, y: nextY });
                    visited[nextY][nextX] = true;
                }
            }
        }
        return null; // Return null if no block is found
    }
    // Translates the next step in a path to a move action
    getNextMoveFromPath(pathToTarget, currentPos) {
        if (pathToTarget && pathToTarget.length > 0) {
            const nextStep = pathToTarget[0];
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
    }
    // Helper function to check if the agent should pickup a block
    shouldPickupBlock(cell) {
        // Check if there's a block to pickup at the current position
        return ((cell.left.type === this.BLOCK &&
            cell.left.level === this.currentLevel) ||
            (cell.right.type === this.BLOCK &&
                cell.right.level === this.currentLevel) ||
            (cell.up.type === this.BLOCK && cell.up.level === this.currentLevel) ||
            (cell.down.type === this.BLOCK && cell.down.level === this.currentLevel));
    }
    explore(gameMap, currentPos) {
        // Check if there's an unexplored direction and move there
        const unexploredDirection = this.findUnexploredDirection(gameMap, currentPos);
        if (unexploredDirection) {
            return unexploredDirection;
        }
        // If all nearby cells are explored, find a new target to explore
        const newExploreTarget = this.findNewExploreTarget(gameMap, currentPos);
        if (newExploreTarget) {
            const pathToNewTarget = this.findPathToTarget(currentPos, newExploreTarget, gameMap);
            if (pathToNewTarget.length > 0) {
                return this.getNextMoveFromPath(pathToNewTarget, currentPos);
            }
        }
        return "wait"; // Fallback if no exploration options are available
    }
    // Finds a direction that has not been explored yet
    findUnexploredDirection(gameMap, currentPos) {
        const directions = [
            { move: "left", x: -1, y: 0 },
            { move: "right", x: 1, y: 0 },
            { move: "up", x: 0, y: -1 },
            { move: "down", x: 0, y: 1 }
        ];
        for (const dir of directions) {
            const newX = currentPos.x + dir.x;
            const newY = currentPos.y + dir.y;
            // Check for valid and unexplored direction
            if (newX >= 0 && newX < gameMap[0].length &&
                newY >= 0 && newY < gameMap.length &&
                gameMap[newY][newX] !== this.WALL // && Check if unexplored logic here
            ) {
                return dir.move;
            }
        }
        return null;
    }
    findNewExploreTarget(gameMap, currentPos) {
        const directions = [
            { x: 1, y: 0 }, // right
            { x: -1, y: 0 }, // left
            { x: 0, y: 1 }, // down
            { x: 0, y: -1 } // up
        ];
        let queue = [{ x: currentPos.x, y: currentPos.y }];
        let visited = Array.from({ length: gameMap.length }, () => Array(gameMap[0].length).fill(false));
        while (queue.length > 0) {
            let { x, y } = queue.shift();
            // Check if the current position is unexplored and not a wall
            if (!visited[y][x] && gameMap[y][x] !== this.WALL) {
                return { x, y };
            }
            visited[y][x] = true;
            // Add adjacent positions to the queue
            for (const dir of directions) {
                const nextX = x + dir.x;
                const nextY = y + dir.y;
                // Check boundaries and whether the position is already visited
                if (nextX >= 0 && nextX < gameMap[0].length &&
                    nextY >= 0 && nextY < gameMap.length &&
                    !visited[nextY][nextX]) {
                    queue.push({ x: nextX, y: nextY });
                }
            }
        }
        return null; // Return null if no unexplored area is found
    }
    // The turn function that the game calls every cycle
    turn(cell, gameMap) {
        // Execute the next move
        return this.decideNextMove(cell, gameMap);
    }
}
