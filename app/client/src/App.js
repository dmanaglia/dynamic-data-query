import React, {useState} from 'react';
import "./app.css";

function App() {
    const [selectedFile, setSelectedFile] = useState();
    const [isSelected, setIsSelected] = useState(false);
	const [fileData, setFileData] = useState();
	const [selectedCells, setSelectedCells] = useState([]);
	const [runQuery, setRunQuery] = useState(false);
	const [tableFiltered, setTableFiltered] = useState(false);
	const [noResults, setNoResults] = useState();

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

	const getOptions = (dataType) => {
		switch(dataType) {
			case "number":	
				return (
					<>
						<li><a class="dropdown-item" href="#">Sort Largest-Smallest</a></li>
						<li><a class="dropdown-item" href="#">Sort Smallest-Largest</a></li>
						<li><a class="dropdown-item" href="#">Group</a></li>
						<li><a class="dropdown-item" href="#">Calc Average</a></li>
						<li><a class="dropdown-item" href="#">Calc Largest</a></li>
						<li><a class="dropdown-item" href="#">Calc Smallest</a></li>
					</>
				);
			default:
				return (
					<>
						<li><a class="dropdown-item" href="#">Group</a></li>
					</>
				);
		}
	}

	const selectCell = (event) => {
		event.target.classList.toggle("selectedCell");
		let newList = [...selectedCells];
		if(event.target.classList.contains("selectedCell")){
			newList.push({column: event.target.getAttribute('data-column'), value: event.target.innerHTML});
		} else {
			newList = newList.filter(obj => obj.column !== event.target.getAttribute('data-column') && obj.value !== event.target.innerHTML);
		}
		if(newList.length){
			setRunQuery(true);
		} else {
			setRunQuery(false);
		}
		setSelectedCells(newList);
	}

	const getAllRows = () => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		fetch('http://localhost:8000/api/all')
		.then((response) => response.json())
		.then((result) => {
			setNoResults();
			setFileData(result);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
		setTableFiltered(false)
	}

	const runUserDefinedQuery = () => {
		setRunQuery(false);
		setSelectedCells([]);
		let allSelectedEl = document.querySelectorAll(".selectedCell");
		allSelectedEl.forEach(el => el.classList.remove('selectedCell'));
		let queryString = `SELECT * FROM mytable WHERE `
		let addition = ``
		for(let i = 0; i < selectedCells.length; i++){
			let condition = selectedCells[i];
			if(typeof condition.value === 'number'){
				addition += `"${condition.column}"=${condition.value}`
			} else {
				addition += `"${condition.column}"='${condition.value}'`
			}
			if(i !== selectedCells.length - 1){
				addition += ` AND `
			}
		}
		queryString += addition;
		fetch('http://localhost:8000/api/query',
			{
				method: "PUT",
				body: queryString
			})
		.then((response) => response.json())
		.then((result) => {
			if(!result.length){
				setNoResults(addition);
			} else {
				setNoResults();
			}
			setFileData(result);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
		setTableFiltered(true)
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
								{noResults ? (
									<div className='d-flex justify-content-center'>
										<h3 className='mt-4 mb-4'>No rows found where {noResults}</h3>
									</div>
								): null}
								<table className='table table-bordered table-sm'>
									{fileData.map((rowObj, index) => (
										<>
											{index ? (
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
															{Object.keys(rowObj).map((item, index) => (
																<>
																	{index ? (
																		<td>
																			<div class="dropdown">
																				<button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
																					{item}
																				</button>
																				<ul class="dropdown-menu">
																					{getOptions(typeof fileData[0][item])}
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
