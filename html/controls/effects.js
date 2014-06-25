// ===================================================================
//
// EFFECTS
//
// ===================================================================

// === Visual effects code ===========================================

function addEffects(imageData, numCols, numRows) {

    var data = imageData.data;
    
    for (var i = 0; i < options.length; i++) {

	var type = options[i];

	switch (type) {
	    case "normal":
	    case "red":
	    case "green":
	    case "blue":
		// Color effects are done on existing image data
		addColorEffect(type, data);
		break;

	    case "mirrorh":
	    case "mirrorv":
	    case "fliph":
	    case "flipv":
		// Mirror effects require copying image data
		addMirrorEffect(type, data, numCols, numRows);
		break;

	    default:
		break;
	}
    }

    return imageData;
}


// Color effects
function addColorEffect(type, data) {

    for (var j = 0; j < data.length; j += 4) {

	switch (type) {

            case "invert":
		data[j] = 255 - data[j];         // r
		data[j + 1] = 255 - data[j + 1]; // g
		data[j + 2] = 255 - data[j + 2]; // b
		break;

            case "red":
		data[j] = Math.min(255,data[j] * 2);   // r
		data[j + 1] = data[j + 1] / 2;         // g
		data[j + 2] = data[j + 2] / 2;         // b
		break;

            case "green":
		data[j] = data[j] / 2;                       // r
		data[j + 1] = Math.min(255,data[j + 1] * 2); // g
		data[j + 2] = data[j + 2] / 2;               // b
		break;

            case "blue":
		data[j] = data[j] / 2;                       // r
		data[j + 1] = data[j + 1] / 2;               // g
		data[j + 2] = Math.min(255,data[j + 2] * 2); // b
		break;

            default:
		break;
	}
    }
}


// Mirror effects
function addMirrorEffect(type, data, numCols, numRows) {

    var data2 = new Uint8ClampedArray(data);    // copy array

    switch (type) {

	case "mirrorh":
	    for (var j = 0; j < data.length/2; j += 4) {

		// set current position
		c = j/4;  // current pixel
		curCol = c % numCols;  // current column
		curRow = parseInt(c / numCols);  // current row, make sure int
			
		// arithmetic to get horizontal mirror values ... don't ask
		f = ((4 * ((numRows - 1 - curRow) * numCols)) + (4 * curCol));

		data[j] = data2[f];
		data[j + 1] = data2[f + 1];
		data[j + 2] = data2[f + 2];
	    }
	    break;

        case "mirrorv":
	    for (var j = 0; j < data.length; j += 4) {

		// set current position
		c = j/4;  // current pixel
		curCol = c % numCols;  // current column
		curRow = parseInt(c / numCols);  // current row, make sure int
			
		// arithmetic to get vertical mirror values ... don't ask
		if (curCol < numCols/2)
		    f = j;
		else
		    f = (4 * (numCols * parseInt(c / numCols))) + (4 * (numCols - 1 - (c % numCols)));

		data[j] = data2[f];
		data[j + 1] = data2[f + 1];
		data[j + 2] = data2[f + 2];
	    }
	    break;

        case "fliph":
	case "flipv":
	    for (var j = 0; j < data.length; j += 4) {

		// set current position
		c = j/4;  // current pixel
		curCol = c % numCols;  // current column
		curRow = parseInt(c / numCols);  // current row, make sure int

		// arithmetic to get horiz and vert flip values ... don't ask
		if (type == "fliph")
		    f = ((4 * ((numRows - 1 - curRow) * numCols)) + (4 * curCol));
		else
		    f = (4 * (numCols * parseInt(c / numCols))) + (4 * (numCols - 1 - (c % numCols)));

		data[j] = data2[f];
		data[j + 1] = data2[f + 1];
		data[j + 2] = data2[f + 2];
	    }
	    break;

        default:
	    break;
    }
}




