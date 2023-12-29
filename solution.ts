class Stacker {
  // Constants representing different cell types
  private readonly EMPTY: number = 0;
  private readonly WALL: number = 1;
  private readonly BLOCK: number = 2;
  private readonly GOLD: number = 3;

  // Agent starts not carrying a block and at level 0 (ground level)
  private carryingBlock: boolean = false;
  private currentLevel: number = 0;
  private currentPos: { x: number; y: number } = {
    x: 0,
    y: 0,
  };
  private goldPos: { x: number; y: number } = {
    x: 0,
    y: 0,
  };

  constructor(
    agentX: number,
    agentY: number,
    goldPosX: number,
    goldPosY: number
  ) {
    // Use agentX and agentY as needed
    this.currentPos.x = agentX;
    this.currentPos.y = agentY;
    this.goldPos.x = goldPosX;
    this.goldPos.y = goldPosY;
  }

  private findPathToTarget(
    start: { x: number; y: number },
    goal: { x: number; y: number },
    gameMap: number[][]
  ): { x: number; y: number }[] {
    class MyNode {
      parent: MyNode | null;
      position: { x: number; y: number };
      g: number = 0; // Cost from start to current node
      h: number = 0; // Heuristic cost from current node to goal
      f: number = 0; // Total cost

      constructor(parent: MyNode | null, position: { x: number; y: number }) {
        this.parent = parent;
        this.position = position;
      }
    }

    function heuristic(
      pos1: { x: number; y: number },
      pos2: { x: number; y: number }
    ): number {
      return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    let startNode = new MyNode(null, start);
    let goalNode = new MyNode(null, goal);
    let openList: MyNode[] = [];
    let closedList = new Set<string>();

    openList.push(startNode);

    while (openList.length > 0) {
      let currentNode = openList.reduce((prev, curr) =>
        prev.f < curr.f ? prev : curr
      );

      openList = openList.filter((item) => item !== currentNode);
      closedList.add(`${currentNode.position.x},${currentNode.position.y}`);

      if (
        currentNode.position.x === goalNode.position.x &&
        currentNode.position.y === goalNode.position.y
      ) {
        let path: { x: number; y: number }[] = [];
        let current: MyNode | null = currentNode;
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

        if (
          nodePosition.x > gameMap.length - 1 ||
          nodePosition.x < 0 ||
          nodePosition.y > gameMap[0].length - 1 ||
          nodePosition.y < 0
        )
          continue;

        if (gameMap[nodePosition.y][nodePosition.x] === this.WALL) continue;

        // Elevation check: Agent can move up or down by one level at a time
        if (
          Math.abs(
            gameMap[nodePosition.y][nodePosition.x] -
              gameMap[currentNode.position.y][currentNode.position.x]
          ) > 1
        )
          continue;

        let newNode = new MyNode(currentNode, nodePosition);

        if (closedList.has(`${newNode.position.x},${newNode.position.y}`))
          continue;

        newNode.g = currentNode.g + 1;
        newNode.h = heuristic(newNode.position, goalNode.position);
        newNode.f = newNode.g + newNode.h;

        if (
          openList.some(
            (node) =>
              node.position.x === newNode.position.x &&
              node.position.y === newNode.position.y &&
              node.f < newNode.f
          )
        )
          continue;

        openList.push(newNode);
      }
    }

    return []; // Return an empty path if no path to the goal is found
  }

  private decideNextMove(cell: any, gameMap: number[][]): string {
    // Case 1: If the gold's position is known and reachable
    if (this.goldPos.x !== -1 && this.goldPos.y !== -1) {
      // Check if the agent is next to the goal and can drop the block to reach the gold
      if (this.carryingBlock && this.isNextToGoal()) {
        // Drop the block if it enables reaching the gold
        return this.decideDropBlock(gameMap);
      }

      // Pathfind to the gold's location
      let pathToGold = this.findPathToTarget(
        this.currentPos,
        this.goldPos,
        gameMap
      );

      // If there's a path and the agent is carrying a block
      if (pathToGold.length > 0 && this.carryingBlock) {
        return this.getNextMoveFromPath(pathToGold, this.currentPos);
      }

      // If there's a path but the agent isn't carrying a block, search for a block
      if (pathToGold.length > 0 && !this.carryingBlock) {
        return this.searchForBlock(cell, gameMap);
      }
    }

    return ["up", "down", "left", "right"][Math.floor(Math.random() * 4)]; // Fallback if no blocks are found
  }

  // Supporting functions used in decideNextMove
  private isNextToGoal(): boolean {
    // Check if the agent is adjacent to the gold and at the correct level to drop a block
    return (
      Math.abs(this.currentPos.x - this.goldPos.x) <= 1 &&
      Math.abs(this.currentPos.y - this.goldPos.y) <= 1 &&
      this.currentLevel + 1 === 8 // Assuming type indicates the level to reach the gold
    );
  }

  private decideDropBlock(gameMap: number[][]): string {
    if (this.isNextToGoal()) {
      this.carryingBlock = false;
      return "drop";
    }
    return this.explore(gameMap, this.currentPos); // Or some other default action if dropping the block is not beneficial
  }

  private searchForBlock(cell: any, gameMap: number[][]): string {
    // Check if there's a block adjacent to pick up
    if (this.shouldPickupBlock(gameMap)) {
      return "pickup";
    }

    // If no block is immediately adjacent, find a path to the nearest block
    let nearestBlockPos = this.findNearestBlock(gameMap);

    if (nearestBlockPos) {
      let pathToNearestBlock = this.findPathToTarget(
        this.currentPos,
        nearestBlockPos,
        gameMap
      );
      if (pathToNearestBlock.length > 0) {
        return this.getNextMoveFromPath(pathToNearestBlock, this.currentPos);
      }
    }

    return ["up", "down", "left", "right"][Math.floor(Math.random() * 4)]; // Fallback if no blocks are found
  }

  private findNearestBlock(
    gameMap: number[][]
  ): { x: number; y: number } | null {
    // Define the relative positions to check around the current position
    const searchOffsets = [
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }, // right
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 }, // down
    ];

    // Check each direction around the current position
    for (let offset of searchOffsets) {
      let searchX = this.currentPos.x + offset.x;
      let searchY = this.currentPos.y + offset.y;

      // Check if the new position is within the game map bounds
      if (
        searchX >= 0 &&
        searchX < gameMap[0].length &&
        searchY >= 0 &&
        searchY < gameMap.length
      ) {
        // Check if there's a block at the position
        if (gameMap[searchY][searchX] === this.BLOCK) {
          return { x: searchX, y: searchY }; // Return the position of the block
        }
      }
    }

    // If no block is found immediately around the current position, return null
    return null;
  }

  // Translates the next step in a path to a move action
  private getNextMoveFromPath(
    pathToTarget: { x: number; y: number }[],
    currentPos: { x: number; y: number }
  ): string {
    if (pathToTarget && pathToTarget.length > 0) {
      const nextStep = pathToTarget[0];

      if (nextStep.x > currentPos.x) return "right";
      if (nextStep.x < currentPos.x) return "left";
      if (nextStep.y > currentPos.y) return "down";
      if (nextStep.y < currentPos.y) return "up";
    }

    return "up"; // Default or fallback move
  }

  // Helper function to check if the agent should pickup a block
  private shouldPickupBlock(gameMap: number[][]): boolean {
    // Return false if the agent is already carrying a block
    if (this.carryingBlock) {
      return false;
    }
  
    // Check if the current position on the game map has a block of level 1
    return gameMap[this.currentPos.y][this.currentPos.x] === this.BLOCK && this.currentLevel === 1;
  }
  

  private explore(
    gameMap: number[][],
    currentPos: { x: number; y: number }
  ): string {
    // Try to find an unexplored direction first
    const unexploredDirection = this.findUnexploredDirection(
      gameMap,
      currentPos
    );
    if (unexploredDirection) {
      return unexploredDirection;
    }

    // If all nearby cells are explored or blocked, try to find a new target to explore
    const newExploreTarget = this.findNewExploreTarget(gameMap, currentPos);
    if (newExploreTarget) {
      const pathToNewTarget = this.findPathToTarget(
        currentPos,
        newExploreTarget,
        gameMap
      );
      if (pathToNewTarget.length > 0) {
        return this.getNextMoveFromPath(pathToNewTarget, currentPos);
      }
    }

    // As a last resort, check if there are any possible moves, even backtracking
    const possibleMove = this.findPossibleMove(gameMap, currentPos);
    if (possibleMove) {
      return possibleMove;
    }

    // If there are no possible moves, then return "up"
    // If there are no possible moves, then return "wait" or a random direction as a last resort
    return ["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
  }

  private findPossibleMove(
    gameMap: number[][],
    currentPos: { x: number; y: number }
  ): string | null {
    const directions = [
      { move: "left", x: -1, y: 0 },
      { move: "right", x: 1, y: 0 },
      { move: "up", x: 0, y: -1 },
      { move: "down", x: 0, y: 1 },
    ];

    for (const dir of directions) {
      const newX = currentPos.x + dir.x;
      const newY = currentPos.y + dir.y;

      // Check if the new position is within the game map and not a wall
      if (
        newX >= 0 &&
        newX < gameMap[0].length &&
        newY >= 0 &&
        newY < gameMap.length &&
        gameMap[newY][newX] !== this.WALL
      ) {
        return dir.move;
      }
    }

    return null;
  }

  // Finds a direction that has not been explored yet
  private findUnexploredDirection(
    gameMap: number[][],
    currentPos: { x: number; y: number }
  ): string | null {
    const directions = [
      { move: "left", x: -1, y: 0 },
      { move: "right", x: 1, y: 0 },
      { move: "up", x: 0, y: -1 },
      { move: "down", x: 0, y: 1 },
    ];

    for (const dir of directions) {
      const newX = currentPos.x + dir.x;
      const newY = currentPos.y + dir.y;

      // Check for valid and unexplored direction
      if (
        newX >= 0 &&
        newX < gameMap[0].length &&
        newY >= 0 &&
        newY < gameMap.length &&
        gameMap[newY][newX] !== this.WALL // && Check if unexplored logic here
      ) {
        return dir.move;
      }
    }

    return null;
  }

  private findNewExploreTarget(
    gameMap: number[][],
    currentPos: { x: number; y: number }
  ): { x: number; y: number } | null {
    const directions = [
      { x: 1, y: 0 }, // right
      { x: -1, y: 0 }, // left
      { x: 0, y: 1 }, // down
      { x: 0, y: -1 }, // up
    ];

    let queue: { x: number; y: number }[] = [
      { x: currentPos.x, y: currentPos.y },
    ];
    let visited: boolean[][] = Array.from({ length: gameMap.length }, () =>
      Array(gameMap[0].length).fill(false)
    );

    while (queue.length > 0) {
      let { x, y } = queue.shift()!;

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
        if (
          nextX >= 0 &&
          nextX < gameMap[0].length &&
          nextY >= 0 &&
          nextY < gameMap.length &&
          !visited[nextY][nextX]
        ) {
          queue.push({ x: nextX, y: nextY });
        }
      }
    }

    return null; // Return null if no unexplored area is found
  }

  // The turn function that the game calls every cycle
  public turn(cell: any, gameMap: any): string {
    // Execute the next move
    return this.decideNextMove(cell, gameMap);
  }
}