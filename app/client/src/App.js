import React, {useState} from 'react';
import "./app.css";

function App() {
    const [selectedFile, setSelectedFile] = useState();
    const [isSelected, setIsSelected] = useState(false);
	const [fileData, setFileData] = useState();
	const [selectedCells, setSelectedCells] = useState([]);
	const [runQuery, setRunQuery] = useState(false);
	const [tableFiltered, setTableFiltered] = useState(false);

    const changeHandler = (event) => {
      	setSelectedFile(event.target.files[0]);
      	setIsSelected(true);
    };

    const handleSubmission = () => {
		if(isSelected){
			const formData = new FormData();
			formData.append('file', selectedFile);
			fetch(
				'http://localhost:8000/upload',
				{
					method: 'POST',
					body: formData
				}
			)
			.then((response) => response.json())
			.then((result) => {
				setFileData(result);
			})
			.catch((error) => {
				console.error('Error:', error);
			});
		}
    };

	const getOptions = (column, indexOneValue) => {
		if(typeof indexOneValue === 'number'){
			return (
				<>
					<li><a class="dropdown-item" onClick={() => largestToSmallest(column)}>Sort Largest-Smallest</a></li>
					<li><a class="dropdown-item" onClick={() => smallestToLargest(column)}>Sort Smallest-Largest</a></li>
					<li><a class="dropdown-item" onClick={() => getAverage(column)}>Calc Average</a></li>
					<li><a class="dropdown-item" onClick={() => getTotal(column)}>Calc Total</a></li>
				</>
			);
		}else {
			try {
				let parsedDate = Date.parse(indexOneValue);
				if (isNaN(parsedDate)) {
					return <li><a class="dropdown-item" onClick={() => groupBy(column)}>Group</a></li>
				} else {
					return (
						<>
							<li><a class="dropdown-item" onClick={() => newestToOldest(column)}>Sort Newest-Oldest</a></li>
							<li><a class="dropdown-item" onClick={() => oldestToNewest(column)}>Sort Oldest-Newest</a></li>
						</>
					);
				}
			} catch(error) {
				return <li><a class="dropdown-item" onClick={() => groupBy(column)}>Group</a></li>
			}
		}
	}

	const selectCell = (event) => {
		event.target.classList.toggle("selectedCell");
		let cellValue = event.target.innerText;
		if(!isNaN(cellValue) && cellValue !== ''){
			cellValue = cellValue * 1
		}
		let newList = [...selectedCells];
		if(event.target.classList.contains("selectedCell")){
			newList.push({column: event.target.getAttribute('data-column'), value: cellValue});
		} else {
			let counter = 0;
			newList = newList.filter(obj => obj.column !== event.target.getAttribute('data-column') || obj.value !== cellValue || counter++ > 0);
		}
		if(newList.length){
			setRunQuery(true);
		} else {
			setRunQuery(false);
		}
		setSelectedCells(newList);
	}

	const fetchQuery = (queryStr) => {
		console.log(queryStr);
		fetch('http://localhost:8000/api/query',
		{
			method: "PUT",
			body: queryStr
		})
		.then((response) => response.json())
		.then((result) => {
			setFileData(result);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
	}

	const getAllRows = () => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(false);
		fetchQuery("SELECT * from mytable");
	}

	const runUserDefinedQuery = () => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		let queryString = `SELECT * FROM mytable WHERE `
		let addition = ``
		for(let i = 0; i < selectedCells.length; i++){
			let condition = selectedCells[i];
			if(typeof condition.value === 'number'){
				addition += `"${condition.column}"=${condition.value}`
			} else if(condition.value === ''){
				addition += `"${condition.column}" IS NULL`
			} else {
				addition += `"${condition.column}"='${condition.value}'`
			}
			if(i !== selectedCells.length - 1){
				addition += ` AND `
			}
		}
		queryString += addition;
		fetchQuery(queryString);
	}

	const largestToSmallest = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		fetchQuery(`SELECT * FROM mytable ORDER BY "${column}" DESC`);
	}

	const smallestToLargest = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		fetchQuery(`SELECT * FROM mytable ORDER BY "${column}" ASC`);
	}

	const getAverage = (column) => {
		console.log(column);
	}

	const getTotal = (column) => {
		console.log(column);
	}

	const groupBy = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		fetchQuery(`SELECT * FROM mytable GROUP BY "${column}"`);
	}

	const newestToOldest = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		fetchQuery(`SELECT * FROM mytable ORDER BY "${column}" DESC`);
	}

	const oldestToNewest = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		fetchQuery(`SELECT * FROM mytable ORDER BY "${column}" ASC`);
	}

    return(
    	<>
			{fileData ? (
				<>
					{tableFiltered ? (
						<button className='btn btn-secondary ms-3 mt-3' onClick={getAllRows}>Back To Full Table</button>
					):null}
					<div className='d-flex justify-content-center mt-2'>
						<h2>{selectedFile.name}</h2>
					</div>
					<div className='d-flex justify-content-center mt-2'>
						<div className='tableContainer'>
							<div className='table-responsive w-100'>
								<table className='table table-bordered table-sm'>
									{fileData.map((rowObj, rowNum) => (
										<>
											{rowNum ? (
												<tr>
													{Object.entries(rowObj).map(([key, value], index) => (
														<>
															{index ? (
																<td onClick={selectCell} data-column={key}>{value}</td>
															):null}
														</>
													))}
												</tr>
											):(
												<>
													<thead className='table-dark'>
															{Object.entries(rowObj).map(([key, value], index) => (
																<>
																	{index ? (
																		<td>
																			<div class="dropdown">
																				<button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
																					{key}
																				</button>
																				<ul class="dropdown-menu">
																					{(() => {
																						let firstRealVal = fileData.find(obj => obj[key] || obj[key] === 0)?.[key];
																						console.log(firstRealVal);
																						firstRealVal = firstRealVal ? firstRealVal : (firstRealVal === 0) ? 0 : '';
																						console.log(firstRealVal);
																						return getOptions(key, firstRealVal);
																					})()}
																				</ul>
																			</div>	
																		</td>
																	):null}
																</>
															))}
													</thead>
													<tr>
														{Object.entries(rowObj).map(([key, value], index) => (
															<>
																{index ? (
																	<td onClick={selectCell} data-column={key}>{value}</td>
																):null}
															</>
														))}
													</tr>
												</>
											)}
										</>
									))}
								</table>
							</div>
						</div>
					</div>
					<div className='d-flex justify-content-center mt-2'>
						{runQuery ? <button className='btn btn-primary' onClick={runUserDefinedQuery}>Filter</button> : <button className='btn btn-primary' disabled>Filter</button>}
					</div>
				</>
			):null}
			<div className='d-flex justify-content-center mt-5'>
				<div className='importContainer'>
					<input 	type="file" 
							name="file" 
							onChange={changeHandler} 
							accept='.xlsx'/>
					<button className="btn btn-primary" onClick={handleSubmission}>Submit</button>
				</div>
			</div>
      	</>
    )
}

export default App;
