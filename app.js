(function () {
    function create2DArray(N, M, defaultValue = '') {
        let arr = new Array(N);
        for (let i = 0; i < N; i++) {
            if (typeof defaultValue == "object") {
                arr[i] = new Array(M).fill({...defaultValue});
            } else {
                arr[i] = new Array(M).fill(defaultValue)
            }
        }
        return arr;
    }

    function numberToColumnName(num) {
        let columnName = ''
        while(num > 0) {
            let remainder = (num - 1) % 26;
            columnName = String.fromCharCode(65 + remainder) + columnName;
            num = Math.floor((num-1)/26); // 33 -> 7 -> C
        }
        return columnName;
    }

    var textInput;

    const rowCount = 100;
    const colCount = 100;
    let mode = "NORMAL" // NORMAL or SEARCH

    let selectedCell = {
        row: 1, col: 1
    }
    let selectedCellRange = {
        startRow: selectedCell.row,
        endRow: selectedCell.row,
        startCol: selectedCell.col,
        endCol: selectedCell.col
    }
    let spreadsheetData = create2DArray(rowCount, colCount, '');
    let cellProperties = create2DArray(rowCount, colCount, {
        textAlign: "left"
    })
    
    let canvas;
    let ctx;
    let rowHeights = new Array(rowCount).fill(26);
    let colWidths = new Array(colCount).fill(100);

    for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
            if (row == 0 && col > 0) {
                spreadsheetData[row][col] = numberToColumnName(col);
                cellProperties[row][col]['textAlign'] = 'center';
            } else if (col == 0 && row > 0) {
                spreadsheetData[row][col] = row.toString();
                cellProperties[row][col]['textAlign'] = 'center';
            }
        }
    }

    var DrawFunctions = (function() {
        function getCellPosition(row, col) {
            let y = 0;
            for (let r = 0; r < row; r++) {
                y += rowHeights[r];
            }
            let x = 0;
            for (let c = 0; c < col; c++) {
                x += colWidths[c];
            }
            return {x, y};
        }

        function drawSingleCell(row, col) {
            const props = cellProperties[row][col];
            const pos = getCellPosition(row, col);
            ctx.strokeRect(pos.x, pos.y, colWidths[col], rowHeights[row]);

            const text = spreadsheetData[row][col];
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            if ('textAlign' in props) {
                ctx.textAlign = props['textAlign'];
            }
            
            const paddingX = 5;
            var textX;
            switch(ctx.textAlign) {
                case 'left':
                    textX = pos.x + paddingX;
                    break;
                case "right":
                    textX = pos.x + colWidths[col] - paddingX;
                    break;
                case "center":
                    textX = pos.x + colWidths[col] / 2;
                    break;
            }

            const textY = pos.y + rowHeights[row] / 2;

            ctx.fillText(text, textX, textY);
        }

        function drawCells() {
            for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                    drawSingleCell(row, col)
                }
            }
        }

        function drawSelectedCellBorder() {
            const pos = getCellPosition(selectedCell.row, selectedCell.col);
            const borderDiv = document.getElementById("selectedCellBorder");
            borderDiv.style.display = "block";
            borderDiv.style.left = `${pos.x + 1}px`;
            borderDiv.style.top = `${pos.y + 1}px`;
            borderDiv.style.width = `${colWidths[selectedCell.col] - 1}px`;
            borderDiv.style.height = `${rowHeights[selectedCell.row] - 1}px`;
            borderDiv.style.border = "3px solid blue";
        }

        function drawSelectedCellRange() {
            console.log(selectedCellRange)
            const selectedRangeDiv = document.getElementById("selectedRange");
            selectedRangeDiv.style.display = "absolute";
            // x , y, width, height
            let rangeStartCol = Math.min(selectedCellRange.endCol,selectedCellRange.startCol);
            let rangeStartRow = Math.min(selectedCellRange.endRow,selectedCellRange.startRow);

            const pos = getCellPosition(rangeStartRow, rangeStartCol);

            selectedRangeDiv.style.left = `${pos.x + 1}px`;
            selectedRangeDiv.style.top = `${pos.y + 1}px`;

            let rangeWidth = 0;
            let rangeHeight = 0;
            let startRow = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
            let endRow = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
            for (let r = startRow; r <= endRow; r++) {
                rangeHeight += rowHeights[r];
            }

            let startCol = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
            let endCol = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);
            for (let c = startCol; c <= endCol; c++) {
                rangeWidth += colWidths[c];
            }

            selectedRangeDiv.style.width = `${rangeWidth}px`;
            selectedRangeDiv.style.height = `${rangeHeight}px`;

            if (selectedCellRange.startRow != selectedCellRange.endRow || selectedCellRange.startCol != selectedCellRange.endCol) {
                selectedRangeDiv.style.border = "1px solid rgba(0,0,255,0.8)";
                selectedRangeDiv.style.background = "rgba(0,0,255, 0.5)";
            } else {
                selectedRangeDiv.style.background = "rgba(0,0,255, 0)";
                selectedRangeDiv.style.border = "1px solid rgba(0,0,255,0)";
            }

        }

        function drawGrid() {
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            drawCells();
            drawSelectedCellBorder();
            drawSelectedCellRange();
        }
        return {drawGrid};
    })()




    document.addEventListener("DOMContentLoaded", function() {
        canvas = document.getElementById("spreadsheet");
        textInput = document.getElementById("textInput");
        ctx = canvas.getContext("2d");
        const canvasWidth = 1200;
        const canvasHeight = 1700;
        const ratio = window.devicePixelRatio;
        canvas.width = canvasWidth * ratio;
        canvas.height = canvasHeight * ratio;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";
        
        ctx.scale(ratio, ratio);
        
        DrawFunctions.drawGrid()
    })

    function canSelectedCellBeShifted(key) {
        const r = selectedCell.row;
        const c = selectedCell.col;
        if (key == "ArrowLeft") {
            return c > 1
        }
        if (key == "ArrowRight") {
            return c < colCount - 1;
        }
        if (key == "ArrowUp") {
            return r > 1;
        }
        if (key == "ArrowDown") {
            return r < rowCount - 1;
        }
    }

    function resetSelectedCellRange() {
        selectedCellRange.startRow = selectedCell.row;
        selectedCellRange.endRow = selectedCell.row;
        selectedCellRange.startCol = selectedCell.col;
        selectedCellRange.endCol = selectedCell.col;
    }

    function handleNormalArrowKeys(key) {
        if (canSelectedCellBeShifted(key)) {
            switch(key) {
                case "ArrowLeft":
                    selectedCell.col -= 1;
                    break;
                case "ArrowRight":
                    selectedCell.col += 1;
                    break;
                case "ArrowUp":
                    selectedCell.row -= 1;
                    break;
                case "ArrowDown":
                    selectedCell.row += 1;
                    break
            }
            // reset here
            resetSelectedCellRange()
        }
    }

    function handleArrowKeys(key) {
        if (mode == "NORMAL") {
            handleNormalArrowKeys(key)
        }
        DrawFunctions.drawGrid();
    }

    function canSelectedRangeBeExpanded(key) {
        switch (key) {
            case "ArrowLeft":
                return selectedCellRange.endCol > 1;
                break;
            case "ArrowRight":
                return selectedCellRange.endCol < colCount - 1;
                break;
            case "ArrowUp":
                return selectedCellRange.endRow > 1;
                break;
            case "ArrowDown":
                return selectedCellRange.endRow < rowCount - 1;
                break;
        }
    }

    function handleNormalShiftArrowKeys(key) {
        // checks if the range can be expanded in the diretcion of the key
        if (canSelectedRangeBeExpanded(key)) {
            console.log('changing selectedCellRange...', key)
            switch(key) {
                case "ArrowLeft":
                    selectedCellRange.endCol -= 1;
                    break;
                case "ArrowRight":
                    selectedCellRange.endCol += 1;
                    break;
                case "ArrowUp":
                    selectedCellRange.endRow -= 1;
                    break;
                case "ArrowDown":
                    selectedCellRange.endRow += 1;
                    break;
            }
            console.log(selectedCellRange)
        }
    }

    function handleShiftArrowKeys(key) {
        if (mode == "NORMAL") {
            handleNormalShiftArrowKeys(key)
        }
        DrawFunctions.drawGrid();
    }

    function displayInput() {
        console.log("display input")
        const pos = getCellPosition(selectedCell.row, selectedCell.col);
        textInput.style.display = "block";
        textInput.style.left = `${pos.x + 1}px`;
        textInput.style.top = `${pos.y + 1}px`;
        textInput.style.width = `${colWidths[selectedCell.col] - 1}px`;
        textInput.style.height = `${rowHeights[selectedCell.row] - 1}px`;
        textInput.style.outline = "2px solid blue";
        textInput.value = spreadsheetData[selectedCell.row][selectedCell.col];
        textInput.focus();
    }

    function handleEnterKey() {
        console.log("handle enter key", textInput.style.display)
        if (textInput.style.display == "none") {
            displayInput();
        }
        
    }

    document.addEventListener("keydown", function(event) {
        let key = event.key;
        if (event.shiftKey && ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(key)) {
            event.preventDefault()    
            handleShiftArrowKeys(key);
        } else if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(key)) {
            event.preventDefault()
            handleArrowKeys(key);
        } else if (key == "Enter") {
            event.preventDefault();
            handleEnterKey();
        }
    })
})()