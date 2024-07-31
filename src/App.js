import React, { useState, useEffect } from 'react';
import './App.css';
import vampireChibi from './images/vampire-chibi.jpg';
import dragon from './images/dragon.jpg';
import eye from './images/eye.jpg';
import blackfox from './images/blackfox.jpg';
import yinandyang from './images/yinandyang.jpg';
import moon from './images/moon.jpg';
import wallpaper1 from './images/wallpaper1.jpg';

const levels = [
  dragon,
  vampireChibi,
  eye,
  blackfox,
  yinandyang,
  moon,
  wallpaper1,
];

const App = () => {
  const [gridSize, setGridSize] = useState(3);
  const [tiles, setTiles] = useState([]);
  const [emptyTile, setEmptyTile] = useState({ row: 0, col: 0 });
  const [currentLevel, setCurrentLevel] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [tileSize, setTileSize] = useState({ width: 0, height: 0 });
  const [showImage, setShowImage] = useState(false); // State for showing the full image

  useEffect(() => {
    resetPuzzle();
  }, [currentLevel, gridSize]);

  const initializePuzzle = async () => {
    try {
      const { tileImages, tileWidth, tileHeight } = await loadAndSplitImage(levels[currentLevel], gridSize, gridSize);
      setTileSize({ width: tileWidth, height: tileHeight });
      const initialTiles = createTiles(tileImages);
      const { shuffledTiles, emptyTile } = shuffleTiles(initialTiles);
      setTiles(shuffledTiles);
      setEmptyTile(emptyTile);
      setPuzzleSolved(false); // Reset puzzle solved state
    } catch (error) {
      console.error('Error in initializePuzzle:', error);
    }
  };

  const resetPuzzle = () => {
    initializePuzzle();
    setShowImage(false); // Hide image when resetting puzzle
  };

  const loadAndSplitImage = async (imageSrc, rows, cols) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const tileWidth = image.width / cols;
        const tileHeight = image.height / rows;
        const tiles = [];

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = tileWidth;
            canvas.height = tileHeight;
            context.drawImage(image, x * tileWidth, y * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
            tiles.push(canvas.toDataURL());
          }
        }
        resolve({ tileImages: tiles, tileWidth, tileHeight });
      };
      image.onerror = (event) => {
        console.error('Image loading error:', event);
        console.error(`Failed to load image: ${imageSrc}`);
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
    });
  };

  const createTiles = (tileImages) => {
    let tileIndex = 0;
    const tiles = [];
    for (let row = 0; row < gridSize; row++) {
      const rowTiles = [];
      for (let col = 0; col < gridSize; col++) {
        if (row === gridSize - 1 && col === gridSize - 1) {
          rowTiles.push(null); // Last tile is empty
        } else {
          rowTiles.push({
            image: tileImages[tileIndex],
            row,
            col,
          });
          tileIndex++;
        }
      }
      tiles.push(rowTiles);
    }
    return tiles;
  };

  const shuffleTiles = (initialTiles) => {
    const flatTiles = initialTiles.flat().filter(tile => tile !== null);
    flatTiles.sort(() => Math.random() - 0.5);
    const shuffledTiles = [];
    let tileIndex = 0;
    let emptyTile = { row: 0, col: 0 };
    for (let row = 0; row < gridSize; row++) {
      const rowTiles = [];
      for (let col = 0; col < gridSize; col++) {
        if (row === gridSize - 1 && col === gridSize - 1) {
          rowTiles.push(null);
          emptyTile = { row, col };
        } else {
          rowTiles.push(flatTiles[tileIndex]);
          tileIndex++;
        }
      }
      shuffledTiles.push(rowTiles);
    }
    return { shuffledTiles, emptyTile };
  };

  const handleTileClick = (row, col) => {
    if (isValidMove(row, col)) {
      const newTiles = tiles.map(row => row.slice());
      newTiles[emptyTile.row][emptyTile.col] = newTiles[row][col];
      newTiles[row][col] = null;
      setTiles(newTiles);
      setEmptyTile({ row, col });
      if (isPuzzleSolved(newTiles)) {
        setPuzzleSolved(true);
        revealHiddenPiece(newTiles);
      }
    }
  };

  const isValidMove = (row, col) => {
    return (Math.abs(row - emptyTile.row) + Math.abs(col - emptyTile.col) === 1);
  };

  const isPuzzleSolved = (tiles) => {
    let tileIndex = 0;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (row === gridSize - 1 && col === gridSize - 1) {
          if (tiles[row][col] !== null) {
            return false;
          }
        } else {
          if (!tiles[row][col] || tiles[row][col].image !== levels[currentLevel][tileIndex]) {
            return false;
          }
          tileIndex++;
        }
      }
    }
    return true;
  };
  
  const revealHiddenPiece = (tiles) => {
    const newTiles = tiles.map(row => row.slice());
    newTiles[emptyTile.row][emptyTile.col] = {
      image: `Tile ${gridSize * gridSize}`,
      row: emptyTile.row,
      col: emptyTile.col
    };
    setTiles(newTiles);
  };

  const goToNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(currentLevel + 1);
    } else {
      setCurrentLevel(0); // Loop back to the first level
    }
    setPuzzleSolved(false); // Reset puzzle solved state when going to next level
  };

  const completePuzzleAutomatically = () => {
    const solvedTiles = tiles.map(row => row.slice()); // Clone the tiles array
  
    // Load the current level image
    const tileImages = levels[currentLevel];
  
    const image = new Image();
    image.src = tileImages;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const tileWidth = image.width / gridSize;
      const tileHeight = image.height / gridSize;
  
      // Draw each tile onto the canvas
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          canvas.width = tileWidth;
          canvas.height = tileHeight;
          context.drawImage(image, col * tileWidth, row * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
  
          // Assign the image data URL to the corresponding tile in solvedTiles
          solvedTiles[row][col] = {
            image: canvas.toDataURL(),
            row,
            col
          };
        }
      }
  
      // Update state to display the completed puzzle
      setTiles(solvedTiles);
      setEmptyTile({ row: gridSize - 1, col: gridSize - 1 }); // Set the empty tile to the last position
      setPuzzleSolved(true); // Mark puzzle as solved
    };
  };

  const toggleImageVisibility = () => {
    setShowImage(!showImage);
  };

  return (
    <div className="App">
      <h1>Puzzle Game</h1>
      <div className="controls">
        {!puzzleSolved && (
          <>
            <button onClick={completePuzzleAutomatically}>Complete Puzzle Automatically</button>
            <button onClick={toggleImageVisibility}>{showImage ? 'Hide Image' : 'Show Image'}</button>
          </>
        )}
        {puzzleSolved && (
          <button onClick={goToNextLevel}>Next Level</button>
        )}
        <button onClick={resetPuzzle}>Reset Puzzle</button>
      </div>
      {showImage && (
        <div className="full-image">
          <img src={levels[currentLevel]} alt="Full Puzzle" />
        </div>
      )}
      <div className="puzzle-container" style={{
        gridTemplateColumns: `repeat(${gridSize}, ${tileSize.width}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${tileSize.height}px)`
      }}>
        {tiles.map((row, rowIndex) =>
          row.map((tile, colIndex) =>
            tile ? (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="puzzle-tile"
                onClick={() => handleTileClick(rowIndex, colIndex)}
                style={{ backgroundImage: `url(${tile.image})`, width: tileSize.width, height: tileSize.height }}
              ></div>
            ) : (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="empty-tile"
                style={{ width: tileSize.width, height: tileSize.height }}
              ></div>
            )
          )
        )}
      </div>
    </div>
  );
};

export default App;
