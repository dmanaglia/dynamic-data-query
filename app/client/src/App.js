import React, {useState} from 'react';
import "./app.css";

function App() {
    const [selectedFile, setSelectedFile] = useState();
    const [isSelected, setIsSelected] = useState(false);
	const [fileData, setFileData] = useState();
	const [selectedCells, setSelectedCells] = useState([]);
	const [runQuery, setRunQuery] = useState(false);
	const [tableFiltered, setTableFiltered] = useState(false);
	const [queryStr, setQueryStr] = useState();
	const [conditionsState, setConditionsState] = useState([]);
	const [calculation, setCalculation] = useState();

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
					<li><button className="dropdown-item" onClick={() => queryDesc(column)}>Sort Largest-Smallest</button></li>
					<li><button className="dropdown-item" onClick={() => queryAsc(column)}>Sort Smallest-Largest</button></li>
					<li><button className="dropdown-item" onClick={() => getAverage(column)}>Calc Average</button></li>
					<li><button className="dropdown-item" onClick={() => getTotal(column)}>Calc Total</button></li>
				</>
			);
		}else {
			try {
				let parsedDate = Date.parse(indexOneValue);
				if (isNaN(parsedDate)) {
					return <li><button className="dropdown-item" onClick={() => queryAsc(column)}>Group</button></li>
				} else {
					return (
						<>
							<li><button className="dropdown-item" onClick={() => queryDesc(column)}>Sort Newest-Oldest</button></li>
							<li><button className="dropdown-item" onClick={() => queryAsc(column)}>Sort Oldest-Newest</button></li>
						</>
					);
				}
			} catch(error) {
				return <li><button className="dropdown-item" onClick={() => queryAsc(column)}>Group</button></li>
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

	const fetchQuery = (query) => {
		fetch('http://localhost:8000/api/query',
		{
			method: "PUT",
			body: query
		})
		.then((response) => response.json())
		.then((result) => {
			setFileData(result);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
	}

	const fetchCalculation = (query) => {
		fetch('http://localhost:8000/api/calculate',
		{
			method: "PUT",
			body: query
		})
		.then((response) => response.json())
		.then((result) => {
			if(query.includes("SUM")){
				setCalculation(`Total = ${result}`);
			} else {
				setCalculation(`Average = ${result}`);
			}
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
		setQueryStr();
		setConditionsState([]);
		setCalculation();
		fetchQuery("SELECT * from mytable");
	}

	const runUserDefinedQuery = () => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		setCalculation();
		setConditionsState([]);
		let conditions = [];
		let queryString = `SELECT * FROM mytable WHERE `
		let addition = ``
		for(let i = 0; i < selectedCells.length; i++){
			let condition = selectedCells[i];
			if(typeof condition.value === 'number'){
				addition += `"${condition.column}"=${condition.value}`;
				conditions.push(`Column "${condition.column}" = ${condition.value}`);
			} else if(condition.value === ''){
				addition += `"${condition.column}" IS NULL`;
				conditions.push(`Column "${condition.column}" is empty`);
			} else {
				addition += `"${condition.column}"='${condition.value}'`;
				conditions.push(`Column "${condition.column}" = ${condition.value}`);
			}
			if(i !== selectedCells.length - 1){
				addition += ` AND `;
			}
		}
		setConditionsState(conditions);
		setQueryStr(addition);
		queryString += addition;
		fetchQuery(queryString);
	}

	const queryDesc = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		setCalculation();

		let conditions = [...conditionsState];
		if(conditions[0]?.includes("Ordered") || conditions[0]?.includes("Calculating")){
			conditions.shift();
		}
		conditions.unshift(`Ordered by column "${column}" descending`);
		setConditionsState(conditions);

		let descStr = `SELECT * FROM mytable`;
		if(queryStr){
			descStr += ` WHERE ${queryStr}`;
		}
		descStr +=  ` ORDER BY "${column}" DESC`
		fetchQuery(descStr);
	}

	const queryAsc = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		setCalculation();

		let conditions = [...conditionsState];
		if(conditions[0]?.includes("Ordered") || conditions[0]?.includes("Calculating")){
			conditions.shift();
		}
		conditions.unshift(`Ordered by column "${column}" ascending`);
		setConditionsState(conditions);

		let ascStr = `SELECT * FROM mytable`;
		if(queryStr){
			ascStr += ` WHERE ${queryStr}`;
		}
		ascStr +=  ` ORDER BY "${column}" ASC`
		fetchQuery(ascStr);
	}

	const getAverage = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		setCalculation();

		let conditions = [...conditionsState];
		if(conditions[0]?.includes("Ordered") || conditions[0]?.includes("Calculating")){
			conditions.shift();
		}
		conditions.unshift(`Calculating average from column "${column}"`);
		setConditionsState(conditions);

		let avgStr = `SELECT AVG("${column}") FROM mytable`;
		if(queryStr){
			avgStr += ` WHERE ${queryStr}`;
		}
		fetchCalculation(avgStr)
	}

	const getTotal = (column) => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		setTableFiltered(true);
		setCalculation();

		let conditions = [...conditionsState];
		if(conditions[0]?.includes("Ordered") || conditions[0]?.includes("Calculating")){
			conditions.shift();
		}
		conditions.unshift(`Calculating total from column "${column}"`);
		setConditionsState(conditions);

		let totalStr = `SELECT SUM("${column}") FROM mytable`;
		if(queryStr){
			totalStr += ` WHERE ${queryStr}`;
		}
		fetchCalculation(totalStr)
	}

    return(
    	<>
			{fileData ? (
				<>
					<div className='d-flex justify-content-between mt-3'>
						{tableFiltered ? (
							<button className='btn btn-primary ms-3 mb-2' onClick={getAllRows}>Back To Full Table</button>
						):(
							<button className='btn btn-primary ms-3 mb-2' disabled>Back To Full Table</button>
						)}
						<h2>{selectedFile.name}</h2>
						<button type="button" className="btn btn-primary  me-3 mb-2" data-bs-toggle="modal" data-bs-target="#selectFileModal">Select New File</button>
					</div>
					{conditionsState.length || calculation ? (
						<div className='d-flex justify-content-center'>
							<div className='conditionsContainer'>
								<h4 className='mt-2 ms-2'>Current Filters:</h4>
								<ul>
									{conditionsState.map((condition, index) => (
										<>
											{condition.includes('Calculating') || condition.includes('Ordered') ? (
												<>
													<p className='mt-2 mb-2'>{condition}</p>
													{conditionsState[1] ? (
														<p className='mb-2'>Where:</p>
													):null}
												</>
											): (
												<li>{condition}</li>
											)}
										</>
									))}
									{calculation ? (
										<div className='d-flex justify-content-center'>
											<h3 className='mt-3 mb-3'>{calculation}</h3>
										</div>
									):null}
								</ul>
							</div>
						</div>
					): null}
					<div className='d-flex justify-content-center mt-2'>
						<div className='tableContainer'>
							{fileData.length ? (
								<div className='table-responsive w-100'>
									<table className='table table-bordered border-dark'>
										<thead className='bg-dark'>
											<tr>
												{Object.entries(fileData[0]).map(([key, value], index) => (
													<>
														{index ? (
															<th className='bg-dark'>
																<div className="dropdown">
																	<button className="btn btn-dark dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
																		{key}
																	</button>
																	<ul className="dropdown-menu">
																		{(() => {
																			let firstRealVal = fileData.find(obj => obj[key] || obj[key] === 0)?.[key];
																			firstRealVal = firstRealVal ? firstRealVal : (firstRealVal === 0) ? 0 : '';
																			return getOptions(key, firstRealVal);
																		})()}
																	</ul>
																</div>	
															</th>
														):null}
													</>
												))}
											</tr>
										</thead>
										<tbody>
											{fileData.map((rowObj, rowNum) => (
												<tr>
													{Object.entries(rowObj).map(([key, value], index) => (
														<>
															{index ? (
																<td onClick={selectCell} data-column={key}>{value}</td>
															):null}
														</>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							):(
								<div className='d-flex justify-content-center'>
									<h2 className='mt-5 mb-5'>No Results Found!</h2>
								</div>
							)}
						</div>
					</div>
					<div className='d-flex justify-content-center mt-2'>
						{runQuery ? <button className='btn btn-primary mb-5' onClick={runUserDefinedQuery}>Filter</button> : <button className='btn btn-primary' disabled>Filter</button>}
					</div>
				</>
			):(
				<div className='d-flex flex-column mt-5'>
					<div className='d-flex justify-content-center'>
						<h2 className='mt-5'>Welcome To Dynamic Data!</h2>
					</div>
					<div className='d-flex justify-content-center'>
						<p>To start, import an excel file!</p>
					</div>
					<div className='d-flex justify-content-center'>
						<button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#selectFileModal">Select File</button>
					</div>
				</div>
			)}
			<div class="modal fade" tabindex="-1" id="selectFileModal">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title">Select File</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
					<div class="modal-body">
						<input 	type="file" name="file" onChange={changeHandler} accept='.xlsx'/>
					</div>
						<div class="modal-footer">
							<button className="btn btn-primary" onClick={handleSubmission} data-bs-dismiss="modal">Submit</button>
						</div>
					</div>
				</div>
			</div>
      	</>
    )
}

export default App;
