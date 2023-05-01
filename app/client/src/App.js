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
					<li><a class="dropdown-item" onClick={() => queryDesc(column)}>Sort Largest-Smallest</a></li>
					<li><a class="dropdown-item" onClick={() => queryAsc(column)}>Sort Smallest-Largest</a></li>
					<li><a class="dropdown-item" onClick={() => getAverage(column)}>Calc Average</a></li>
					<li><a class="dropdown-item" onClick={() => getTotal(column)}>Calc Total</a></li>
				</>
			);
		}else {
			try {
				let parsedDate = Date.parse(indexOneValue);
				if (isNaN(parsedDate)) {
					return <li><a class="dropdown-item" onClick={() => queryAsc(column)}>Group</a></li>
				} else {
					return (
						<>
							<li><a class="dropdown-item" onClick={() => queryDesc(column)}>Sort Newest-Oldest</a></li>
							<li><a class="dropdown-item" onClick={() => queryAsc(column)}>Sort Oldest-Newest</a></li>
						</>
					);
				}
			} catch(error) {
				return <li><a class="dropdown-item" onClick={() => queryAsc(column)}>Group</a></li>
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
					{tableFiltered ? (
						<button className='btn btn-secondary ms-3 mt-3' onClick={getAllRows}>Back To Full Table</button>
					):null}
					<div className='d-flex justify-content-center mt-2'>
						<h2>{selectedFile.name}</h2>
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
																						firstRealVal = firstRealVal ? firstRealVal : (firstRealVal === 0) ? 0 : '';
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
