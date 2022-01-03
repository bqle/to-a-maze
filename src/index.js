import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Heapify from "heapify";

const m = 15;
const n = 15;

class Square extends React.Component {
render() {
var color = "#ffffff";
if (this.props.value.value == 0) {
  color = "#ffffff";
} else if (this.props.value.value == 1) {
  color = "#3f7fbf";
} else if (this.props.value.value == 2) {
  color = "#c37979";
} else {
  color = "#339933";
}
return (
    <button className="square" 
        style={{backgroundColor: color,
                transition: "all .2s ease",
                WebkitTransition: "all .2s ease",
                MozTransition: "all .2s ease",
                borderTopWidth: this.props.value.topEdge ? '1px' : '0px',
                borderBottomWidth: this.props.value.botEdge ? '1px' : '0px',
                borderRightWidth: this.props.value.rightEdge ? '1px' : '0px',
                borderLeftWidth: this.props.value.leftEdge ? '1px' : '0px',
              }}
              
    >
    </button>
);
}
}

class Board extends React.Component {
renderSquare(valueSet) {
    return (
    <Square
        value={valueSet}
    />
    );
}

render() {
    let board = this.props.board;
    
    return (
    <div className="board">
        {
            board.map((singleRow) => {return (<div className="board-row">
                {singleRow.map(singleCol => {
                    return this.renderSquare(singleCol);
                })}
                
            </div>)})
        }
    </div>
    );
}
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle(array) { // Knuth shuffle
  var currentIndex = array.length,  randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function union(set1, set2) {
  let res = new Set();
  set1.forEach(key => res.add(key));
  set2.forEach(key => res.add(key));
  return res;
}

class Game extends React.Component {
constructor(props) {
    super(props);
    let defaultBoard = Array(m).fill(null).map(() => (Array(n)));
    defaultBoard[0][0] = {i: 0, j: 0, value: 0, leftEdge: false, rightEdge: false, topEdge: true, botEdge: false}
    defaultBoard[0][n-1] = {i: 0, j: n-1, value: 0, leftEdge: false, rightEdge: true, topEdge: true, botEdge:false}
    defaultBoard[m-1][0] = {i: m-1, j: 0, value: 0, leftEdge: true, rightEdge: false, topEdge: false, botEdge:true}
    defaultBoard[m-1][n-1] = {i: m-1, j: n-1, value: 0, leftEdge: false, rightEdge: true, topEdge: false, botEdge: false}

    // top board edge
    for (let j = 1; j < n - 1; j++) {
      defaultBoard[0][j] = {i: 0, j: j, value: 0, leftEdge: false, rightEdge: false, topEdge: true, botEdge: false}
    }
    // left board edge
    for (let i = 1; i < m-1; i++) {
      defaultBoard[i][0] = {i:i, j: 0, value: 0, leftEdge: true, rightEdge: false, topEdge: false, botEdge: false}
    }
    // bot board edge
    for (let j= 1; j < n-1; j++) {
      defaultBoard[m-1][j] = {i: m-1, j: j, value: 0, leftEdge: false, rightEdge: false, topEdge: false,  botEdge: true}
    }
    // right board edge
    for (let i= 1; i < m-1; i++) {
      defaultBoard[i][n-1] = {i: i, j: n-1, value: 0, leftEdge: false, rightEdge: true, topEdge: false,  botEdge: false}
    }
    for (let i = 1 ; i < defaultBoard.length - 1; i++) {
        for (let j = 1; j < defaultBoard[0].length - 1; j++) {
            defaultBoard[i][j] = {
              i: i,
              j: j, 
              value: 0, // 0 is unvisited, 1 is visited during generation,
                        // 2 is visited during solution, 3 is picked after solution
              leftEdge: false, 
              rightEdge: false,
              topEdge: false,
              botEdge: false,
            };
        }
    }
    this.randomizedChoice = [[0,1,2,3], [0,1,3,2], [0,2,1,3], [0,2,3,1], [0,3,1,2], [0,3,2,1],
                              [1,0,2,3], [1,0,3,2], [1,2,0,3], [1,2,3,0], [1,3,0,2], [1,3,2,0],
                              [2,0,1,3], [2,0,3,1], [2,1,0,3], [2,1,3,0], [2,3,0,1], [2,3,1,0],
                              [3,0,1,2], [3,0,2,1], [3,1,0,2], [3,1,2,0], [3,2,0,1], [3,2,1,0]];
    this.isRunning = false;
    this.genSpeed = 1;
    this.state = {
        defaultBoard: defaultBoard,
        // make sure edges and board are synced in every update method afterwards
        board: defaultBoard,
        edges:  new Set(), // vertex order:  'top.i-top.j-bottom.i-bottom.j' or 'left.i-left.j-right.i-right.j'
        state: 0, // 0 - default, 1 - creating maze, 2 - created maze, 3 - finding path, 4 - found path
    };
}

addEdge(p1, p2) {
  if ((p1.i == p2.i && Math.abs(p1.j - p2.j) == 1) || 
      (p1.j == p2.j && Math.abs(p1.i - p2.i) == 1)) 
  {
    var cloneEdges = new Set(this.state.edges);
    var cloneBoard = this.state.board.slice();
    if (p1.i == p2.i && p1.j == p2.j - 1) { // p1 to the left of p2
      let edgePair = p1.i + "-" + p1.j + "-" + p2.i + "-" + p2.j;
      cloneEdges.add(edgePair);
      cloneBoard[p1.i][p1.j].rightEdge = true;
    } else if (p1.i == p2.i && p1.j == p2.j + 1) { // p1 to the left of p2
      let edgePair = p2.i + "-" + p2.j + "-" + p1.i + "-" + p1.j;
      cloneEdges.add(edgePair);
      cloneBoard[p2.i][p2.j].rightEdge = true;
    } else if (p1.j == p2.j && p1.i == p2.i - 1) { // p1 on top of p2
      let edgePair = p1.i + "-" + p1.j + "-" + p2.i + "-" + p2.j;
      cloneEdges.add(edgePair);
      cloneBoard[p1.i][p1.j].botEdge = true;
    } else if (p1.j == p2.j && p1.i == p2.i + 1) { // p1 below p2
      let edgePair = p2.i + "-" + p2.j + "-" + p1.i + "-" + p1.j;
      cloneEdges.add(edgePair);
      cloneBoard[p2.i][p2.j].botEdge = true;
    }

    this.setState({
      board: cloneBoard,
      edges: cloneEdges,
    }) 
  }
}

removeEdge(p1, p2) {
  if ((p1.i == p2.i && Math.abs(p1.j - p2.j) == 1) || 
      (p1.j == p2.j && Math.abs(p1.i - p2.i) == 1)) 
  {
    var cloneEdges = new Set(this.state.edges);
    var cloneBoard = this.state.board.slice();
    if (p1.i == p2.i && p1.j == p2.j - 1) { // p1 to the left of p2
      let edgePair = p1.i + "-" + p1.j + "-" + p2.i + "-" + p2.j;
      cloneEdges.delete(edgePair);
      cloneBoard[p1.i][p1.j].rightEdge = false;
      cloneBoard[p2.i][p2.j].leftEdge = false;
    } else if (p1.i == p2.i && p1.j == p2.j + 1) { // p1 to the left of p2
      let edgePair = p2.i + "-" + p2.j + "-" + p1.i + "-" + p1.j;
      cloneEdges.delete(edgePair);
      cloneBoard[p1.i][p1.j].leftEdge = false;
      cloneBoard[p2.i][p2.j].rightEdge = false;
    } else if (p1.j == p2.j && p1.i == p2.i - 1) { // p1 on top of p2
      let edgePair = p1.i + "-" + p1.j + "-" + p2.i + "-" + p2.j;
      cloneEdges.delete(edgePair);
      cloneBoard[p1.i][p1.j].botEdge = false;
      cloneBoard[p2.i][p2.j].topEdge = false;
    } else if (p1.j == p2.j && p1.i == p2.i + 1) { // p1 below p2
      let edgePair = p2.i + "-" + p2.j + "-" + p1.i + "-" + p1.j;
      cloneEdges.delete(edgePair);
      cloneBoard[p1.i][p1.j].topEdge = false;
      cloneBoard[p2.i][p2.j].botEdge = false;
    }

    this.setState({
      board: cloneBoard,
      edges: cloneEdges,
    }) 
  }
}

fillAllEdges() {
  var fullEdges = new Set();
  var cloneBoard = this.state.board.slice();
  // horizontal edges
  for (let i = 0 ; i < m - 1 ; i++) {
    for (let j = 0; j < n; j++) {
      let edge = i+"-"+j+"-"+(i+1)+"-"+j;
      cloneBoard[i][j].botEdge = true;
      fullEdges.add(edge);
    }
  }
  // vertical edges
  for (let i = 0; i < m; i++) {
    for (let j = 0 ; j < n -1;j++ ){
      let edge = i+"-"+j+"-"+i+"-"+(j+1);
      cloneBoard[i][j].rightEdge = true;
      fullEdges.add(edge);
    }
  }
  console.log(fullEdges.size);

  this.setState({
    edges: fullEdges,
    board: cloneBoard,
  })
  return fullEdges;
}

// generating algorithms
async dfsGenerator() {
  if (this.isRunning || this.state.state >= 2) {return;}
  this.isRunning = true;
  this.reset();
  this.setState({
    state: 1,
  })
  await sleep(100);
  let board = this.state.board.slice();
  this.fillAllEdges();
  await sleep(100);
  await this.dfsGeneratorRecursive(board[0][0], board);
  await sleep(100);
  this.resetBoardValues();
  this.isRunning = false;
  this.setState({
    state: 2,
  })
}

async dfsGeneratorRecursive(cell, board) {
  board[cell.i][cell.j].value = 1;
  this.setState({
    board: board,
  })
  let randomMovement = this.randomizedChoice[Math.floor(Math.random() * 24)];
  for (let i = 0 ; i < randomMovement.length; i++) {
    let direction = randomMovement[i];
    switch (direction) {
      case(0): 
        // move up
        if (cell.i - 1 >= 0 && board[cell.i - 1][cell.j].value != 1) {
          this.removeEdge(board[cell.i-1][cell.j], board[cell.i][cell.j]);
          await sleep(50);
          await this.dfsGeneratorRecursive(board[cell.i-1][cell.j], board);
        }
        break;
      case(1): 
        if (cell.j - 1 >= 0 && board[cell.i][cell.j - 1].value != 1) {
          this.removeEdge(board[cell.i][cell.j-1], board[cell.i][cell.j]);
          await sleep(50);
          await this.dfsGeneratorRecursive(board[cell.i][cell.j -1], board);
        }
        break;
      case(2): 
        if (cell.i + 1 < m && board[cell.i + 1][cell.j].value != 1) {
          this.removeEdge(board[cell.i][cell.j], board[cell.i+1][cell.j]);
          await sleep(50);
          await this.dfsGeneratorRecursive(board[cell.i+1][cell.j], board);
        }
        break;
      case(3) :
        if (cell.j + 1 < n && board[cell.i][cell.j + 1].value != 1) {
          this.removeEdge(board[cell.i][cell.j], board[cell.i][cell.j+1]);
          await sleep(50);  
          await this.dfsGeneratorRecursive(board[cell.i][cell.j + 1], board);
        }
        break;
    }
  }
  
}

async kruskalsGenerator() {
  if (this.isRunning || this.state.state >= 2) {return;}
  this.isRunning = true;
  this.reset();
  this.setState({
    state: 1,
  })
  await sleep(500);
  let allEdgesSet = this.fillAllEdges();
  let allEdges = new Array();
  allEdgesSet.forEach((edge) => {
    allEdges.push(edge);
  });
  await shuffle(allEdges);
  let allSets = Array(m).fill(null).map(() => (Array(n)));
  for (let i = 0 ; i < m ; i++) {
    for (let j = 0; j < n ; j++) {
      let set = new Set();
      set.add(i+"-"+j);
      allSets[i][j] = set;
    }
  }

  for (let i = 0 ; i < allEdges.length; i++) {
    let split = allEdges[i].split("-").map((val) => (parseInt(val)));
    let p1 = this.state.board[split[0]][split[1]];
    let p2 = this.state.board[split[2]][split[3]];
    let p1str = split[0]+"-"+split[1];
    let p2str = split[2]+"-"+split[3];
    if (!allSets[p1.i][p1.j].has(p2str)) {
      await sleep(50);
      this.removeEdge(p1, p2);
      let newSet = union(allSets[p1.i][p1.j], allSets[p2.i][p2.j]);
      newSet.forEach((vertex) => {
        let vertexSplit = vertex.split("-").map((val) => (parseInt(val)));
        allSets[vertexSplit[0]][vertexSplit[1]] = newSet;
      });
    } 
  }
  let flashBoard = this.state.board.slice();
  for (let i =0 ; i < m ; i ++) {
    for (let j = 0;  j< n ;j ++) {
      flashBoard[i][j].value = 1;
    }
  }
  this.setState({
    board: flashBoard,
  })
  await sleep(200);
  this.resetBoardValues();
  console.log("Kruskal's done");
  this.isRunning = false;
  this.setState({
    state: 2,
  })

}

async primsGenerator() {
  if (this.isRunning || this.state.state >= 2) {return;}
  this.isRunning = true;
  this.reset();
  this.setState({
    state: 1,
  })
  await sleep(500);
  this.fillAllEdges();
  let randomI = Math.floor(Math.random() * m);
  let randomJ = Math.floor(Math.random() * n);
  let board = this.state.board.slice();
  board[randomI][randomJ].value = 1; 
  this.setState({
    board: board,
  })
  let visitedWalls = new Set();
  let wallList = new Array();
  if (randomI - 1 >= 0) {
    wallList.push({i1: randomI-1, j1: randomJ, i2: randomI, j2: randomJ});
    visitedWalls.add((randomI-1)+"-"+randomJ+"-"+randomI+"-"+randomJ);
  }
  if (randomJ - 1 >= 0) {
    wallList.push({i1: randomI, j1: randomJ -1, i2: randomI, j2: randomJ});
    visitedWalls.add(randomI+"-"+(randomJ-1)+"-"+randomI+"-"+randomJ);
  }
  if (randomI + 1 < m) {
    wallList.push({i1: randomI, j1: randomJ, i2: randomI + 1, j2: randomJ});
    visitedWalls.add(randomI+"-"+randomJ+"-"+(randomI+1)+"-"+randomJ);
  }
  if (randomJ + 1 < n) {
    wallList.push({i1: randomI, j1: randomJ, i2: randomI, j2: randomJ + 1});
    visitedWalls.add(randomI+"-"+randomJ+"-"+randomI+"-"+(randomJ+1));
  }

  while (wallList.length > 0) {
    let choice = Math.floor(Math.random() * wallList.length);
    let randomWall = wallList[choice];
    await sleep(50);
    if (board[randomWall.i1][randomWall.j1].value != 1) {
      this.removeEdge(board[randomWall.i1][randomWall.j1], board[randomWall.i2][randomWall.j2]);
      board[randomWall.i1][randomWall.j1].value = 1;
      if (randomWall.i1 - 1 >= 0 && !visitedWalls.has((randomWall.i1 - 1)+"-"+randomWall.j1+"-"+randomWall.i1+"-"+randomWall.j1)) {
        wallList.push({i1: randomWall.i1 - 1, j1: randomWall.j1, i2: randomWall.i1, j2: randomWall.j1});
        visitedWalls.add((randomWall.i1 - 1)+"-"+randomWall.j1+"-"+randomWall.i1+"-"+randomWall.j1);
      }
      if (randomWall.j1 - 1 >= 0 && !visitedWalls.has(randomWall.i1+"-"+(randomWall.j1+1)+"-"+randomWall.i1+"-"+randomWall.j1)) {
        wallList.push({i1: randomWall.i1, j1: randomWall.j1 - 1, i2: randomWall.i1, j2: randomWall.j1});
        visitedWalls.add(randomWall.i1+"-"+(randomWall.j1+1)+"-"+randomWall.i1+"-"+randomWall.j1);
      }
      if (randomWall.i1 + 1 < m && !visitedWalls.has(randomWall.i1+"-"+randomWall.j1+"-"+(randomWall.i1 + 1)+"-"+randomWall.j1)) {
        wallList.push({i1: randomWall.i1, j1: randomWall.j1, i2: randomWall.i1 + 1, j2: randomWall.j1});
        visitedWalls.add(randomWall.i1+"-"+randomWall.j1+"-"+(randomWall.i1 + 1)+"-"+randomWall.j1);
      }
      if (randomWall.j1 + 1 < n && !visitedWalls.has(randomWall.i1+"-"+randomWall.j1+"-"+randomWall.i1+"-"+(randomWall.j1 + 1))) {
        wallList.push({i1: randomWall.i1, j1: randomWall.j1, i2: randomWall.i1, j2: randomWall.j1 + 1});
        visitedWalls.add(randomWall.i1+"-"+randomWall.j1+"-"+randomWall.i1+"-"+(randomWall.j1 + 1));
      }
    }
    if (board[randomWall.i2][randomWall.j2].value != 1) {
      this.removeEdge(board[randomWall.i1][randomWall.j1], board[randomWall.i2][randomWall.j2]);
      board[randomWall.i2][randomWall.j2].value = 1;
      if (randomWall.i2 - 1 >= 0 && !visitedWalls.has((randomWall.i2 - 1)+"-"+randomWall.j2+"-"+randomWall.i2+"-"+randomWall.j2)) {
        wallList.push({i1: randomWall.i2 - 1, j1: randomWall.j2, i2: randomWall.i2, j2: randomWall.j2});
        visitedWalls.add((randomWall.i2 - 1)+"-"+randomWall.j2+"-"+randomWall.i2+"-"+randomWall.j2);
      }
      if (randomWall.j2 - 1 >= 0 && !visitedWalls.has(randomWall.i2+"-"+(randomWall.j2+1)+"-"+randomWall.i2+"-"+randomWall.j2)) {
        wallList.push({i1: randomWall.i2, j1: randomWall.j2 - 1, i2: randomWall.i2, j2: randomWall.j2});
        visitedWalls.add(randomWall.i2+"-"+(randomWall.j2+1)+"-"+randomWall.i2+"-"+randomWall.j2);
      }
      if (randomWall.i2 + 1 < m && !visitedWalls.has(randomWall.i2+"-"+randomWall.j2+"-"+(randomWall.i2 + 1)+"-"+randomWall.j2)) {
        wallList.push({i1: randomWall.i2, j1: randomWall.j2, i2: randomWall.i2 + 1, j2: randomWall.j2});
        visitedWalls.add(randomWall.i2+"-"+randomWall.j2+"-"+(randomWall.i2 + 1)+"-"+randomWall.j2);
      }
      if (randomWall.j2 + 1 < n && !visitedWalls.has(randomWall.i2+"-"+randomWall.j2+"-"+randomWall.i2+"-"+(randomWall.j2 + 1))) {
        wallList.push({i1: randomWall.i2, j1: randomWall.j2, i2: randomWall.i2, j2: randomWall.j2 + 1});
        visitedWalls.add(randomWall.i2+"-"+randomWall.j2+"-"+randomWall.i2+"-"+(randomWall.j2 + 1));
      }
    }
    this.setState({
      board: board,
    })
    wallList.splice(choice, 1);
  }
  await sleep(100);
  this.resetBoardValues();
  this.setState({
    state: 2,
  })
  console.log("Prim's finished");
  this.isRunning = false;

}

async recursiveDivGenerator() {
  if (this.isRunning || this.state.state >= 2){return;}
  this.isRunning = true;
  this.setState({
    state: 1,
  })
  await sleep(100);
  await this.recursiveDivide(0, n-1, 0, m-1);
  let flashBoard = this.state.board.slice();
  for (let i =0 ; i < m ; i ++) {
    for (let j = 0;  j< n ;j ++) {
      flashBoard[i][j].value = 1;
    }
  }
  this.setState({
    board: flashBoard,
  })
  await sleep(200);
  this.resetBoardValues();
  this.setState({
    state: 2,
  })
  console.log("recursive divide done");
  this.isRunning = false;
}

async recursiveDivide(left, right, top, bottom) { // inclusive
  if (right === left || bottom === top) {return;}
  await sleep(50);
  let verDivide = left + Math.floor(Math.random() * (right - left));
  let horDivide = top + Math.floor(Math.random() * (bottom - top));
  
  let board = this.state.board.slice();
  let edges = new Set(this.state.edges);
  for (let i = top; i <= bottom; i++) {
    board[i][verDivide].rightEdge = true;
    let edge = i + "-" + verDivide + "-" + i + "-" + (verDivide + 1);
    edges.add(edge);
  }
  for (let j = left; j <= right; j++) {
    board[horDivide][j].botEdge = true;
    let edge = horDivide + "-" + j + "-" + (horDivide + 1) + "-" + j;
    edges.add(edge);
  }
  this.setState({
    board: board,
    edges: edges, 
  })
  await sleep(50);
  let unpicked = Math.floor(Math.random() * 4);
  console.log(unpicked);
  if (unpicked != 0) { // North edge
    let choice = top + Math.floor(Math.random() * (horDivide - top));
    board[choice][verDivide].rightEdge = false;
    let edge = choice + "-" + verDivide + "-" + choice + "-" + (verDivide + 1);
    edges.delete(edge);
  }
  if (unpicked != 1) { // East edge
    let choice = verDivide + 1 + Math.floor(Math.random() * (right - verDivide - 1));
    board[horDivide][choice].botEdge = false;
    let edge = horDivide + "-" + choice + "-" + (horDivide +1)+ "-" + choice;
    edges.delete(edge);
  }
  if (unpicked != 2) { // South edge
    let choice = horDivide + 1 + Math.floor(Math.random() * (bottom - horDivide -1));
    board[choice][verDivide].rightEdge = false;
    let edge = choice + "-" + verDivide + "-" + choice + "-" + (verDivide + 1);
    edges.delete(edge);
  }
  if (unpicked != 3) { // West edge
    let choice = left + Math.floor(Math.random() * (verDivide - left));
    board[horDivide][choice].botEdge = false;
    let edge = horDivide + "-" + choice + "-" + (horDivide+1) + "-" + choice; 
    edges.delete(edge);
  }
  this.setState({
    board: board,
    edges: edges,
  })
  await sleep(50);
  await this.recursiveDivide(left, verDivide, top, horDivide);
  await sleep(50);
  await this.recursiveDivide(verDivide+1, right, top, horDivide);
  await sleep(50);
  await this.recursiveDivide(left, verDivide, horDivide+1, bottom);
  await sleep(50);
  await this.recursiveDivide(verDivide+1, right, horDivide+1, bottom);
}

async reset() {
  if (this.isRunning) {return;}
  let defaultBoard = Array(m).fill(null).map(() => (Array(n)));
  defaultBoard[0][0] = {i: 0, j: 0, value: 0, leftEdge: false, rightEdge: false, topEdge: true, botEdge: false}
  defaultBoard[0][n-1] = {i: 0, j: n-1, value: 0, leftEdge: false, rightEdge: true, topEdge: true, botEdge:false}
  defaultBoard[m-1][0] = {i: m-1, j: 0, value: 0, leftEdge: true, rightEdge: false, topEdge: false, botEdge:true}
  defaultBoard[m-1][n-1] = {i: m-1, j: n-1, value: 0, leftEdge: false, rightEdge: true, topEdge: false, botEdge: false}

  // top board edge
  for (let j = 1; j < n - 1; j++) {
    defaultBoard[0][j] = {i: 0, j: j, value: 0, leftEdge: false, rightEdge: false, topEdge: true, botEdge: false}
  }
  // left board edge
  for (let i = 1; i < m-1; i++) {
    defaultBoard[i][0] = {i:i, j: 0, value: 0, leftEdge: true, rightEdge: false, topEdge: false, botEdge: false}
  }
  // bot board edge
  for (let j= 1; j < n-1; j++) {
    defaultBoard[m-1][j] = {i: m-1, j: j, value: 0, leftEdge: false, rightEdge: false, topEdge: false,  botEdge: true}
  }
  // right board edge
  for (let i= 1; i < m-1; i++) {
    defaultBoard[i][n-1] = {i: i, j: n-1, value: 0, leftEdge: false, rightEdge: true, topEdge: false,  botEdge: false}
  }
  for (let i = 1 ; i < defaultBoard.length - 1; i++) {
      for (let j = 1; j < defaultBoard[0].length - 1; j++) {
          defaultBoard[i][j] = {
            i: i,
            j: j, 
            value: 0,
            leftEdge: false, 
            rightEdge: false,
            topEdge: false,
            botEdge: false,
          };
      }
  }
  this.setState({
      board: defaultBoard,
      edges: new Set(),
      state: 0,
  });
}

resetBoardValues() {
  let resetBoard = this.state.board.slice();
  for (let i =0 ; i < m ; i ++) {
    for (let j = 0;  j< n ;j ++) {
      resetBoard[i][j].value = 0;
    }
  }
  this.setState({
    board: resetBoard,
    state: 0
  });
}

// solving algorithms
async bfs() {
  if (this.isRunning) {return;}
  this.isRunning = true;
  let board = this.state.board.slice();
  this.resetBoardValues();

  let visited = Array(m).fill(null).map(() => (Array(n)));
  let oldFrontier = [board[0][0]];
  let newFrontier = new Array();
  board[0][0].value = 2;
  visited[0][0] = 0;
  this.setState({
    board: board,
  })
  this.setState({
    state: 3,
  })
  await sleep(100);

  while (oldFrontier.length != 0) {
    let level = visited[oldFrontier[0].i][oldFrontier[0].j];
    let foundExit = false;
    for (let i = 0 ; i < oldFrontier.length; i++) {
      let foc = oldFrontier[i];
      if (foc.i - 1 >= 0 && (!this.state.edges.has((foc.i-1)+"-"+foc.j+"-"+foc.i+"-"+foc.j)) && board[foc.i-1][foc.j].value != 2) {
        visited[foc.i-1][foc.j] = level + 1;
        board[foc.i-1][foc.j].value = 2;
        newFrontier.push(board[foc.i -1][foc.j]);
        if (foc.i-1 == m-1 && foc.j == n-1) {foundExit = true; break;}
      }
      if (foc.j - 1 >= 0 && (!this.state.edges.has(foc.i+"-"+(foc.j-1)+"-"+foc.i+"-"+foc.j)) && board[foc.i][foc.j -1].value != 2) {
        visited[foc.i][foc.j-1] = level + 1;
        board[foc.i][foc.j-1].value = 2;
        newFrontier.push(board[foc.i][foc.j -1]);
        if (foc.i == m-1 && foc.j-1 == n-1) {foundExit = true; break;}
      }
      if (foc.i + 1 < m && (!this.state.edges.has(foc.i+"-"+foc.j+"-"+(foc.i+1)+"-"+foc.j)) && board[foc.i + 1][foc.j].value != 2) {
        visited[foc.i+1][foc.j] = level + 1;
        board[foc.i+1][foc.j].value = 2;
        newFrontier.push(board[foc.i+1][foc.j]);
        if (foc.i+1 == m-1 && foc.j == n-1) {foundExit = true; break;}
      }
      if (foc.j + 1 < n && (!this.state.edges.has(foc.i+"-"+foc.j+"-"+foc.i+"-"+(foc.j+1))) && board[foc.i][foc.j + 1].value != 2) {
        visited[foc.i][foc.j + 1] = level + 1;
        board[foc.i][foc.j + 1].value = 2;
        newFrontier.push(board[foc.i][foc.j +1]);
        if (foc.i == m-1 && foc.j+1 == n-1) {foundExit = true; break;}
      }
    }
    oldFrontier = JSON.parse(JSON.stringify(newFrontier));
    this.setState({
      board: board,
    })
    await sleep(100);
    newFrontier = new Array();
    if(foundExit) {break;}
  }
  await sleep(100);
  this.resetBoardValues();
  let path = new Array();
  path.unshift({i: m-1, j: n-1});
  while (path.length == 0 || path[0].i != 0 || path[0].j != 0) {
    let foc = path[0];
    if (foc.i - 1 >= 0 && (!this.state.edges.has((foc.i-1)+"-"+foc.j+"-"+foc.i+"-"+foc.j)) 
      && visited[foc.i-1][foc.j] == visited[foc.i][foc.j] - 1) {
        path.unshift({i: foc.i-1, j: foc.j});
    } else if (foc.j - 1 >= 0 && (!this.state.edges.has(foc.i+"-"+(foc.j-1)+"-"+foc.i+"-"+foc.j)) 
      && visited[foc.i][foc.j-1] == visited[foc.i][foc.j] - 1) {
        path.unshift({i: foc.i, j: foc.j-1});
        continue;
    } else if (foc.i + 1 < m && (!this.state.edges.has(foc.i+"-"+foc.j+"-"+(foc.i+1)+"-"+foc.j)) 
      && visited[foc.i+1][foc.j] == visited[foc.i][foc.j] - 1) {
        path.unshift({i: foc.i+1, j: foc.j});
        continue;
    }else if (foc.j + 1 < n && (!this.state.edges.has(foc.i+"-"+foc.j+"-"+foc.i+"-"+(foc.j +1)))
      && visited[foc.i][foc.j+1] == visited[foc.i][foc.j] - 1) {
        path.unshift({i: foc.i, j: foc.j+1});
        continue;
    }
  }
  await sleep(200);
  for (let i = 0; i < path.length; i++) {
    board = this.state.board.slice();
    board[path[i].i][path[i].j].value = 2;
    this.setState({
      board: board,
    })
    await sleep(100);
  }
  this.setState({
    state: 4,
  })
  this.isRunning = false;
  console.log("BFS done");
}

async wallHugger() {
  if (this.isRunning) {return;}
  if (!this.isMapGenerated()) {
    alert("A maze is not generated yet.")
    return;
  }
  this.resetBoardValues();
  this.setState({
    state: 3,
  })
  this.isRunning = true;
  let posI = 0;
  let posJ = 0;
  let board = this.state.board.slice();
  board[posI][posJ].value = 2;
  this.setState({
    board: board,
  })
  this.resetBoardValues();
  await sleep(100);
  let facing = 0; // 0 - north, 1 - east, 2 - south , 3 - west
  while (posI != m-1 || posJ != n-1) {
    console.log(posI + " " + posJ + " " + facing);
    board[posI][posJ].value = 0;
    switch (facing) {
      case (0) :
        if (posJ + 1 < n && !this.state.edges.has(posI + "-" + posJ + "-" + posI + "-" + (posJ+1))) { // can travel right
          posJ = posJ + 1;
          facing = 1;
        } else if (posI - 1 >= 0 && !this.state.edges.has((posI-1) + "-" + posJ +"-" + posI + "-" + posJ)) { // can travel forward
          posI = posI - 1;
        } else if (posJ - 1 >= 0 && !this.state.edges.has(posI + "-" + (posJ-1)+ "-" + posI + "-" + posJ)) {  // can travel left
          posJ = posJ -1;
          facing = 3
        } else { // can travel backwards
          posI = posI + 1; 
          facing = 2;
        }
        break;
      case (1) :
        if (posI + 1 < m && !this.state.edges.has(posI + "-" + posJ + "-" + (posI+1) + "-" + posJ)) {
          posI = posI + 1;
          facing = 2;
        } else if (posJ + 1 < n && !this.state.edges.has(posI + "-" + posJ + "-" + posI + "-" + (posJ+1))) {
          posJ = posJ + 1;
          facing = 1;
        } else if (posI - 1 >= 0 && !this.state.edges.has((posI-1) + "-" + posJ +"-" + posI + "-" + posJ)) {
          posI = posI - 1;
          facing = 0;
        } else {
          posJ = posJ -1;
          facing = 3
        }
        break;
      case (2) :
        if (posJ - 1 >= 0 && !this.state.edges.has(posI + "-" + (posJ-1)+ "-" + posI + "-" + posJ)) {
          posJ = posJ -1;
          facing = 3
        } else if (posI + 1 < m && !this.state.edges.has(posI + "-" + posJ + "-" + (posI+1) + "-" + posJ)) {
          posI = posI + 1;
          facing = 2;
        } else if (posJ + 1 < n && !this.state.edges.has(posI + "-" + posJ + "-" + posI + "-" + (posJ+1))) {
          posJ = posJ + 1;
          facing = 1;
        } else {
          posI = posI - 1;
          facing = 0;
        }
        break;
      case (3) : 
        if (posI - 1 >= 0 && !this.state.edges.has((posI-1) + "-" + posJ +"-" + posI + "-" + posJ)) {
          posI = posI - 1;
          facing = 0;
        } else if (posJ - 1 >= 0 && !this.state.edges.has(posI + "-" + (posJ-1)+ "-" + posI + "-" + posJ)) {
          posJ = posJ -1;
          facing = 3
        } else if (posI + 1 < m && !this.state.edges.has(posI + "-" + posJ + "-" + (posI+1) + "-" + posJ)) {
          posI = posI + 1;
          facing = 2;
        } else {
          posJ = posJ + 1;
          facing = 1;
        }
        break;
    }
    board[posI][posJ].value = 2;
    this.setState({
      board: board,
    })
    await sleep(100);
  }
  this.setState({
    state: 4,
  })
  this.isRunning = false;
  console.log("wallhugger done");

}
isMapGenerated() {
  for (let i = 1 ; i < m-1; i ++) {
    for (let j = 1; j < n-1; j++) {
      if (this.state.board[i][j].rightEdge||
          this.state.board[i][j].leftEdge||
          this.state.board[i][j].botEdge|| 
          this.state.board[i][j].topEdge) {
            return true;
      }
    }
  }
  return false;
}

async aStar() {
  if (this.isRunning) {return;}
  this.setState({
    state: 3,
  })
  this.isRunning = true;
  this.resetBoardValues();


  let h = Array(m).fill(null).map(() => (Array(n)));
  for (let i = 0 ; i < m ; i ++ ){
    for (let j = 0; j < n; j++) {
      h[i][j] = m+n-2-i-j;
    }
  }
  let cloneBoard = this.state.board.slice();
  let openSet = new Heapify(m*n);
  let openSetStr = new Set();

  let cameFrom = Array(m).fill(null).map(() => (Array(n)));
  let gScore = Array(m).fill(null).map(() => (Array(n)));
  let fScore = Array(m).fill(null).map(() => (Array(n)));
  for (let i = 0; i < m ; i++) {
    for (let j = 0 ; j < n; j++) {
      gScore[i][j] = Number.MAX_SAFE_INTEGER;
      fScore[i][j] = Number.MAX_SAFE_INTEGER;
    }
  }
  cameFrom[0][0] = null;
  gScore[0][0] = 0;
  fScore[0][0] = h[0][0];
  openSet.push(0*100 + 0, fScore[0][0]);
  openSetStr.add("0-0");
  cloneBoard[0][0].value = 2;
  this.setState({
    board: cloneBoard
  });
  await sleep(100);

  let path = null;
  while (openSet.size != 0) {
    let focN = openSet.pop();
    let foc = {i: Math.floor(focN/100), j : focN%100};
    if (foc.i == m-1 && foc.j == n-1) {
      path = this.reconstructPath(cameFrom, foc);
      break;
    }
    if (foc.i - 1 >= 0 && !this.state.edges.has((foc.i-1)+"-"+foc.j+"-"+foc.i+"-"+foc.j)) {
      let tentativeGScore = gScore[foc.i][foc.j] + 1;
      if (tentativeGScore < gScore[foc.i-1][foc.j]) {
        cameFrom[foc.i-1][foc.j] = foc;
        gScore[foc.i-1][foc.j] = tentativeGScore;
        fScore[foc.i-1][foc.j] = gScore[foc.i-1][foc.j] + h[foc.i-1][foc.j];
        if (!openSetStr.has((foc.i-1)+"-"+foc.j)) {
          openSet.push((foc.i-1) *100 +foc.j, fScore[foc.i-1][foc.j]);
          openSetStr.add((foc.i-1)+"-"+foc.j);
          cloneBoard[foc.i-1][foc.j].value = 2;
        }
      }
    }
    if (foc.j - 1 >= 0 && !this.state.edges.has(foc.i+"-"+(foc.j-1)+"-"+foc.i+"-"+foc.j)) {
      let tentativeGScore = gScore[foc.i][foc.j] + 1;
      if (tentativeGScore < gScore[foc.i][foc.j-1]) {
        cameFrom[foc.i][foc.j-1] = foc;
        gScore[foc.i][foc.j-1] = tentativeGScore;
        fScore[foc.i][foc.j-1] = gScore[foc.i][foc.j-1] + h[foc.i][foc.j-1];
        if (!openSetStr.has(foc.i+"-"+(foc.j-1))) {
          openSet.push(foc.i * 100 +(foc.j-1), fScore[foc.i][foc.j-1]);
          openSetStr.add(foc.i+"-"+(foc.j-1));
          cloneBoard[foc.i][foc.j-1].value = 2;
        }
      }
    }
    if (foc.i + 1 < m && !this.state.edges.has(foc.i+"-"+foc.j+"-"+(foc.i+1)+"-"+foc.j)) {
      let tentativeGScore = gScore[foc.i][foc.j] + 1;
      if (tentativeGScore < gScore[foc.i+1][foc.j]) {
        cameFrom[foc.i+1][foc.j] = foc;
        gScore[foc.i+1][foc.j] = tentativeGScore;
        fScore[foc.i+1][foc.j] = gScore[foc.i+1][foc.j] + h[foc.i+1][foc.j];
        if (!openSetStr.has((foc.i+1)+"-"+foc.j)) {
          openSet.push((foc.i+1)*100 +foc.j, fScore[foc.i+1][foc.j]);
          openSetStr.add((foc.i+1)+"-"+foc.j);
          cloneBoard[foc.i+1][foc.j].value = 2;
        }
      }
    }
    if (foc.j + 1 < n && !this.state.edges.has(foc.i+"-"+foc.j+"-"+foc.i+"-"+(foc.j+1))) {
      let tentativeGScore = gScore[foc.i][foc.j] + 1;
      if (tentativeGScore < gScore[foc.i][foc.j+1]) {
        cameFrom[foc.i][foc.j+1] = foc;
        gScore[foc.i][foc.j+1] = tentativeGScore;
        fScore[foc.i][foc.j+1] = gScore[foc.i][foc.j+1] + h[foc.i][foc.j+1];
        if (!openSetStr.has(foc.i+"-"+(foc.j+1))) {
          openSet.push(foc.i * 100 +( foc.j+1), fScore[foc.i][foc.j+1]);
          openSetStr.add(foc.i+"-"+(foc.j+1));
          cloneBoard[foc.i][foc.j+1].value = 2;
        }
      }
    }
    this.setState({
      board: cloneBoard
    });
    await sleep(100);
  }
  await sleep(100);
  this.resetBoardValues();
  await sleep(200);
  if (path != null) {
    for (let i = 0 ; i < path.length; i++) {
      cloneBoard = this.state.board.slice();
      cloneBoard[path[i].i][path[i].j].value = 2;
      this.setState({
        board: cloneBoard,
      })
      await sleep(100);
    }
  }
  this.setState({
    state: 4,
  })
  this.isRunning = false;
  console.log("done A*");
}
reconstructPath(cameFrom, foc) {
  let totalPath = [foc];
  while (foc != null) {
    foc = cameFrom[foc.i][foc.j];
    totalPath.unshift(foc);
  }
  totalPath.shift();
  return totalPath;
}

render() {
    return (
    <div className="game">
        <div className="game-info">
            <div >To A Maze (do you know the way?)</div>
            <div>
              <div style={{font: '14px'}}>Generation</div>
                <button onClick={() => this.dfsGenerator()}>DFS</button>
                <button onClick={() => this.kruskalsGenerator()}>Kruskal's</button>
                <br></br>
                <button onClick={() => this.primsGenerator()}>Prim's</button>
                <button onClick={() => this.recursiveDivGenerator()}>Recursive Division</button>
                
            </div>
            <br></br>
            <div>
                <div style={{font: '14px'}}>Solution</div>
                <button onClick={() => this.wallHugger()}>Wall hugger</button>
                <button onClick={() => this.aStar()}>A*</button>
                <button onClick={() => this.bfs()}>BFS</button>
            </div>
            <br></br>
            <div>{
                this.state.state == 0 && 
                <div>Maze is empty</div>
            }
            {
                this.state.state == 1 && 
                <div>Generating maze...</div>
            }    
            {
                this.state.state == 2 && 
                <div>Maze is generated</div>
            }    
            {
                this.state.state == 3 && 
                <div>Finding exit...</div>
            }       
            {
                this.state.state == 4 && 
                <div>Exit is found!</div>
            }       
            </div>
            <br></br>
            <button onClick={() => this.reset()}>Reset</button>
        </div>
        <div className="game-board">
        <Board
            board={this.state.board}
        />
        </div>
    </div>
    );
}
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));
