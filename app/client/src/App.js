import React, {useState} from 'react';
import "./app.css";

function App() {
    const [selectedFile, setSelectedFile] = useState();
    const [isSelected, setIsSelected] = useState(false);
	const [fileData, setFileData] = useState();

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
				setFileData(result)
			})
			.catch((error) => {
				console.error('Error:', error);
			});
		}
    };

    return(
    	<div>
			<div>
				{fileData ? (
					<>
						<h2>{selectedFile.name}</h2>
						<div className='table-responsive w-100'>
							<table className='table table-bordered'>
								{fileData.map((rowObj, index) => (
									<>
										{index ? (
											<tr>
												{Object.values(rowObj).map((item, index) => (
													<>
														{index ? (
															<td>{item}</td>
														):null}
													</>
												))}
											</tr>
										):(
											<>
												<thead className='table-dark"'>
													{Object.keys(rowObj).map((item, index) => (
														<>
															{index ? (
																<td>
																	<div class="dropdown">
																		<button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
																			{item}
																		</button>
																		<ul class="dropdown-menu">
																			<li><a class="dropdown-item" href="#">Average</a></li>
																			<li><a class="dropdown-item" href="#">Find Largest</a></li>
																			<li><a class="dropdown-item" href="#">Find Smallest</a></li>
																		</ul>
																	</div>	
																</td>
															):null}
														</>
													))}
												</thead>
												<tr>
													{Object.values(rowObj).map((item, index) => (
														<>
															{index ? (
																<td>{item}</td>
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
					</>
				):null}
			</div>
			<div className='d-flex justify-content-center mt-5'>
				<div className='importContainer'>
					<input 	type="file" 
							name="file" 
							onChange={changeHandler} 
							accept='.xlsx'/>
					<button className="btn btn-secondary" onClick={handleSubmission}>Submit</button>
				</div>
			</div>
      	</div>
    )
}

export default App;
