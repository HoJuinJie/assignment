<script>
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import Layout from '../../../navBar.svelte';
	import Modal from '../../../../lib/CreatePlanModel.svelte';
	import { customAlert } from '../../../../lib/errorHandler';
	import OpenState from '$lib/OpenState.svelte';
	import CreateTaskModel from '$lib/createTaskModel.svelte';
	import ShowTask from '../../../../lib/showTask.svelte';
	import EditTask from '$lib/EditTask.svelte';

	import { appWritable } from '../store';

	let globalUsername;
	let isAdmin = false;
	let isPL = false;
	let showModal = false;
	let showCreateTask = false;
	let plans = [];
	let distinctPlans = [];
	let appTasks = [];

	let showEditTask = false;
	let editTaskIndex = null;

	const ApiUrl = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/auth';
	const ApiUrl_TMS = import.meta.env.VITE_API_URL + ':' + import.meta.env.VITE_PORT + '/api/v1/tms';

	let newPlan = {
		planName: null,
		appAcronym: null,
		startDate: null,
		endDate: null,
		colour: '#000000'
	};

	let newTask = {
		taskID: '',
		planName: '',
		appAcronym: '',
		taskName: '',
		taskDescription: '', //
		taskNotes: '',
		taskState: 'open',
		taskCreator: '',
		taskOwner: '',
		taskCreateDate: '',
		taskDisplayDate: '',
		notesToAdd: '',
		taskExistingPlan: '',
		taskNextState: ''
	};

	// console.log(`newTask: ${JSON.stringify(newTask)}`);
	// appWritable.subscribe((v) => console.log('logging sub', v));

	function setCreateTaskFields() {
		const today = new Date();
		const day = today.getDate().toString().padStart(2, '0');
		const month = (today.getMonth() + 1).toString().padStart(2, '0');
		const year = today.getFullYear();
		const formattedDate = `${year}-${month}-${day}`;
		const displayDate = `${day}/${month}/${year}`;

		newTask.taskID = $appWritable.App_Acronym + '_' + $appWritable.App_Rnumber.toString();
		newTask.appAcronym = $appWritable.App_Acronym;
		newTask.taskCreator = globalUsername;
		newTask.taskOwner = globalUsername;
		newTask.taskCreateDate = formattedDate;
		newTask.taskDisplayDate = displayDate;
	}

	const getTasksInApp = async (app) => {
		try {
			const response = await axios.post(ApiUrl_TMS + '/getTasksInApp', app, {
				withCredentials: true
			});
			appTasks = response.data;
			console.log('logging tasks in app', appTasks);
		} catch (error) {
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
		// console.log('logging tasks in app', appTasks);
	};

	const getPlansInApp = async (app) => {
		console.log('testing get plans in app func by logging app', app);
		try {
			const response = await axios.post(ApiUrl_TMS + '/getPlansInApp', app, {
				withCredentials: true
			});
			distinctPlans = response.data;
			console.log('logging distinct plans', distinctPlans);
		} catch (error) {
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	};

	const getPlans = async () => {
		// Dont need this function
		try {
			const planList = await axios.get(ApiUrl_TMS + '/plans', { withCredentials: true });
			plans = planList.data;
			console.log('logging all plans', plans);
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	};

	onMount(async () => {
		console.log('log appwritable:', $appWritable);
		if (!$appWritable) {
			goto('/homePage/application');
			return;
		}
		try {
			const response = await axios.get(ApiUrl + '/application', { withCredentials: true });
			if (response.status === 401) goto('/login');
			globalUsername = response.data.username;
			isAdmin = response.data.isAdmin;
			isPL = response.data.isPL;
			newPlan.appAcronym = $appWritable.App_Acronym;
			getPlans();
			setCreateTaskFields();
			await getPlansInApp($appWritable);
			await getTasksInApp($appWritable);
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			goto('/login');
		}
	});

	function resetNewPlan() {
		newPlan = {
			planName: null,
			appAcronym: $appWritable.App_Acronym,
			startDate: null,
			endDate: null,
			colour: '#000000'
		};
	}

	async function createNewPlan() {
		console.log(newPlan);
		try {
			const response = await axios.post(ApiUrl_TMS + '/createPlan', newPlan, {
				withCredentials: true
			});
			customAlert(`New plan: ${newPlan.planName} created`);
			resetNewPlan();
			getPlansInApp($appWritable);
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}

	function resetNewTask() {
		console.log('reset new task');
		newTask = {
			taskID: '',
			planName: '',
			appAcronym: '',
			taskName: '',
			taskDescription: '', //
			taskNotes: '',
			taskState: 'open',
			taskCreator: '',
			taskOwner: '',
			taskCreateDate: '',
			taskDisplayDate: '',
			notesToAdd: ''
		};
		setCreateTaskFields();
	}

	async function createNewTask() {
		console.log('clicking on create new task');

		let now = new Date();
		let hours = String(now.getHours()).padStart(2, '0');
		let minutes = String(now.getMinutes()).padStart(2, '0');
		let seconds = String(now.getSeconds()).padStart(2, '0');
		let formattedTime = `${hours}:${minutes}:${seconds}`;

		if (newTask.taskName) {
			// may need to change the [user from onwer/creator to globalusername]
			if (newTask.notesToAdd === '') {
				newTask.taskNotes = `${newTask.taskCreator} created the task " ${newTask.taskName}" \n[${newTask.taskCreator}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
			} else {
				newTask.taskNotes =
					`${newTask.taskCreator} created the task "${newTask.taskName}" \n[${newTask.taskCreator}, Current state: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n` +
					newTask.notesToAdd +
					`\n[${newTask.taskCreator}, Current state: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
			}
		}

		console.log('logging new task from createnewtask function', newTask);
		console.log(newTask.taskNotes);
		try {
			const response = await axios.post(ApiUrl_TMS + '/createTask', newTask, {
				withCredentials: true
			});

			customAlert(`New task: ${newTask.taskName} created`);
			resetNewTask();
			getTasksInApp($appWritable);

			console.log('logging newTask after creating task', newTask);
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}

	function getPlanColor(planName) {
		if (!planName) return 'white';
		const result = distinctPlans.filter((plan) => plan.Plan_MVP_name === planName);
		return result[0].Plan_colour;
	}

	async function changeTaskStateTo(state) {
		console.log('clicking on promote task');
		let now = new Date();
		let hours = String(now.getHours()).padStart(2, '0');
		let minutes = String(now.getMinutes()).padStart(2, '0');
		let seconds = String(now.getSeconds()).padStart(2, '0');
		let formattedTime = `${hours}:${minutes}:${seconds}`;

		// changes to plan (OPEN state)
		if (newTask.planName !== newTask.taskExistingPlan) {
			// may need to change the [user from onwer/creator to globalusername]
			if (newTask.planName === '') {
				newTask.taskNotes += `${newTask.taskOwner} removed the plan \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
				newTask.taskExistingPlan = newTask.planName;
			} else if (newTask.taskExistingPlan === '') {
				newTask.taskNotes += `${newTask.taskOwner} updated the plan to ${newTask.planName} \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
				newTask.taskExistingPlan = newTask.planName;
			} else {
				newTask.taskNotes += `${newTask.taskOwner} updated the plan from ${newTask.taskExistingPlan} to ${newTask.planName} \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
				newTask.taskExistingPlan = newTask.planName;
			}
		}

		// changes to notes
		if (newTask.notesToAdd !== '') {
			newTask.taskNotes += `${newTask.notesToAdd} \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
		}

		// changes state  // may need to change the [user from onwer/creator to globalusername]
		newTask.taskNotes += `${newTask.taskOwner} moved ${newTask.taskName} from <${newTask.taskState}> state to <${state}> state \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;

		// update state in database
		newTask.taskState = state;
		try {
			const response = await axios.post(ApiUrl_TMS + '/saveTaskChanges', newTask, {
				withCredentials: true
			});
			customAlert(`${newTask.taskName} changed state`);
			newTask.notesToAdd = '';
			getTasksInApp($appWritable);
			showEditTask = false;
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}

	async function saveChanges() {
		console.log('clicking on save changes');
		console.log('logging newTask fields in edit mode', newTask);

		let now = new Date();
		let hours = String(now.getHours()).padStart(2, '0');
		let minutes = String(now.getMinutes()).padStart(2, '0');
		let seconds = String(now.getSeconds()).padStart(2, '0');
		let formattedTime = `${hours}:${minutes}:${seconds}`;

		if (newTask.planName !== newTask.taskExistingPlan) {
			// may need to change the [user from onwer/creator to globalusername]
			if (newTask.planName === '') {
				newTask.taskNotes += `${newTask.taskOwner} removed the plan \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
				newTask.taskExistingPlan = newTask.planName;
			} else if (newTask.taskExistingPlan === '') {
				newTask.taskNotes += `${newTask.taskOwner} updated the plan to ${newTask.planName} \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
				newTask.taskExistingPlan = newTask.planName;
			} else {
				newTask.taskNotes += `${newTask.taskOwner} updated the plan from ${newTask.taskExistingPlan} to ${newTask.planName} \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
				newTask.taskExistingPlan = newTask.planName;
			}
		}

		if (newTask.notesToAdd !== '') {
			// may need to change the [user from onwer/creator to globalusername]
			newTask.taskNotes += `${newTask.notesToAdd} \n[${newTask.taskOwner}, Current State: ${newTask.taskState}, ${newTask.taskDisplayDate} at ${formattedTime}]\n\n`;
		}

		try {
			const response = await axios.post(ApiUrl_TMS + '/saveTaskChanges', newTask, {
				withCredentials: true
			});

			customAlert(`${newTask.taskName} updated sucessfully`);
			newTask.notesToAdd = '';
			getTasksInApp($appWritable);
		} catch (error) {
			console.log(error.response.data.message);
			toast.error(error.response.data.message);
			if (error.response.status === 401) goto('/login');
		}
	}
</script>

<Layout bind:globalUsername>
	<span slot="NavContentLeft" class="greet">Hello, {globalUsername}</span>
	<div slot="NavContentCenter" class="navCenter">
		<a
			href="/homePage/application"
			class:active={$page.url.pathname === '/homePage/application'}
			class="links">Application</a
		>
		{#if isAdmin}
			<a
				href="/homePage/userManagement"
				class:active={$page.url.pathname === '/homePage/userManagement'}
				class="links">User Management</a
			>
		{/if}
	</div>
	<div slot="NavContentRight" class="edit">Edit Profile</div>
	<div slot="NavContentRightRight" class="logout">Logout</div>
</Layout>

<main>
	<div class="container">
		<div class="header">
			<h1 class="head">Task Management Board: {newPlan.appAcronym}</h1>
			<div class="middle"></div>
			<div class="createPlan">
				<button
					class="createPlanBtn"
					on:click={() => {
						showModal = true;
					}}>+PLAN</button
				>
			</div>
		</div>
		<div class="kanban">

			<div class="kanban-container">
				<OpenState
					createTask={() => {
						resetNewTask();
						showCreateTask = true;
					}}
				/>
				<div class="kanbanTask">
					{#each appTasks as task, index}
						{#if task.Task_state === 'open'}
							<ShowTask
								taskDetails={task}
								color={getPlanColor(task.Task_plan)}
								viewTask={() => {
									showEditTask = true;
									editTaskIndex = index;
									newTask.taskID = appTasks[editTaskIndex].Task_id;
									newTask.planName = appTasks[editTaskIndex].Task_plan || '';
									newTask.appAcronym = appTasks[editTaskIndex].Task_app_Acronym;
									newTask.taskName = appTasks[editTaskIndex].Task_name;
									newTask.taskDescription = appTasks[editTaskIndex].Task_description;
									newTask.taskNotes = appTasks[editTaskIndex].Task_notes;
									newTask.taskState = appTasks[editTaskIndex].Task_state;
									newTask.taskCreator = appTasks[editTaskIndex].Task_creator;
									newTask.taskOwner = appTasks[editTaskIndex].Task_owner;
									newTask.taskCreateDate = appTasks[editTaskIndex].Task_createDate;
									newTask.taskExistingPlan = appTasks[editTaskIndex].Task_plan || '';
									newTask.taskNextState = 'to do';
								}}
							/>
						{/if}
					{/each}
				</div>
			</div>

			<div class="kanban-container">
				<h2 class="title-header">To Do</h2>
				<div class="kanbanTask">
					{#each appTasks as task, index}
						{#if task.Task_state === 'to do'}
							<ShowTask
								taskDetails={task}
								color={getPlanColor(task.Task_plan)}
								viewTask={() => {
									showEditTask = true;
									editTaskIndex = index;
									newTask.taskID = appTasks[editTaskIndex].Task_id;
									newTask.planName = appTasks[editTaskIndex].Task_plan || '';
									newTask.appAcronym = appTasks[editTaskIndex].Task_app_Acronym;
									newTask.taskName = appTasks[editTaskIndex].Task_name;
									newTask.taskDescription = appTasks[editTaskIndex].Task_description;
									newTask.taskNotes = appTasks[editTaskIndex].Task_notes;
									newTask.taskState = appTasks[editTaskIndex].Task_state;
									newTask.taskCreator = appTasks[editTaskIndex].Task_creator;
									newTask.taskOwner = appTasks[editTaskIndex].Task_owner;
									newTask.taskCreateDate = appTasks[editTaskIndex].Task_createDate;
									newTask.taskExistingPlan = appTasks[editTaskIndex].Task_plan || '';
									newTask.taskNextState = 'doing';
								}}
							/>
						{/if}
					{/each}
				</div>
			</div>

			<div class="kanban-container">
				<h2 class="title-header">Doing</h2>
				<div class="kanbanTask">
					{#each appTasks as task, index}
						{#if task.Task_state === 'doing'}
							<ShowTask
								taskDetails={task}
								color={getPlanColor(task.Task_plan)}
								viewTask={() => {
									showEditTask = true;
									editTaskIndex = index;
									newTask.taskID = appTasks[editTaskIndex].Task_id;
									newTask.planName = appTasks[editTaskIndex].Task_plan || '';
									newTask.appAcronym = appTasks[editTaskIndex].Task_app_Acronym;
									newTask.taskName = appTasks[editTaskIndex].Task_name;
									newTask.taskDescription = appTasks[editTaskIndex].Task_description;
									newTask.taskNotes = appTasks[editTaskIndex].Task_notes;
									newTask.taskState = appTasks[editTaskIndex].Task_state;
									newTask.taskCreator = appTasks[editTaskIndex].Task_creator;
									newTask.taskOwner = appTasks[editTaskIndex].Task_owner;
									newTask.taskCreateDate = appTasks[editTaskIndex].Task_createDate;
									newTask.taskExistingPlan = appTasks[editTaskIndex].Task_plan || '';
									newTask.taskNextState = 'done';
								}}
							/>
						{/if}
					{/each}
				</div>
			</div>

			<div class="kanban-container">
				<h2 class="title-header">Done</h2>
				<div class="kanbanTask">
					{#each appTasks as task, index}
						{#if task.Task_state === 'done'}
							<ShowTask
								taskDetails={task}
								color={getPlanColor(task.Task_plan)}
								viewTask={() => {
									showEditTask = true;
									editTaskIndex = index;
									newTask.taskID = appTasks[editTaskIndex].Task_id;
									newTask.planName = appTasks[editTaskIndex].Task_plan || '';
									newTask.appAcronym = appTasks[editTaskIndex].Task_app_Acronym;
									newTask.taskName = appTasks[editTaskIndex].Task_name;
									newTask.taskDescription = appTasks[editTaskIndex].Task_description;
									newTask.taskNotes = appTasks[editTaskIndex].Task_notes;
									newTask.taskState = appTasks[editTaskIndex].Task_state;
									newTask.taskCreator = appTasks[editTaskIndex].Task_creator;
									newTask.taskOwner = appTasks[editTaskIndex].Task_owner;
									newTask.taskCreateDate = appTasks[editTaskIndex].Task_createDate;
									newTask.taskExistingPlan = appTasks[editTaskIndex].Task_plan || '';
									newTask.taskNextState = 'closed';
								}}
							/>
						{/if}
					{/each}
				</div>
			</div>

			<div class="kanban-container">
				<h2 class="title-header">Closed</h2>
				<div class="kanbanTask">
					{#each appTasks as task, index}
						{#if task.Task_state === 'closed'}
							<ShowTask
								taskDetails={task}
								color={getPlanColor(task.Task_plan)}
								viewTask={() => {
									showEditTask = true;
									editTaskIndex = index;
									newTask.taskID = appTasks[editTaskIndex].Task_id;
									newTask.planName = appTasks[editTaskIndex].Task_plan || '';
									newTask.appAcronym = appTasks[editTaskIndex].Task_app_Acronym;
									newTask.taskName = appTasks[editTaskIndex].Task_name;
									newTask.taskDescription = appTasks[editTaskIndex].Task_description;
									newTask.taskNotes = appTasks[editTaskIndex].Task_notes;
									newTask.taskState = appTasks[editTaskIndex].Task_state;
									newTask.taskCreator = appTasks[editTaskIndex].Task_creator;
									newTask.taskOwner = appTasks[editTaskIndex].Task_owner;
									newTask.taskCreateDate = appTasks[editTaskIndex].Task_createDate;
									newTask.taskExistingPlan = appTasks[editTaskIndex].Task_plan || '';
									newTask.taskNextState = 'closed';
								}}
							/>
						{/if}
					{/each}
				</div>
			</div>

		</div>
	</div>
</main>

<Modal bind:showModal>
	<h2 slot="header">Create Plan</h2>
	<div class="input-container">
		<label for="appAcronym" style="margin-bottom: 10px;">App Acronym</label>
		<span id="appAcronym">{newPlan.appAcronym}</span>
	</div>
	<div class="input-container">
		<label for="planName" style="margin-bottom: 10px;"
			>Plan MVP Name<span style="color: red;">*</span></label
		>
		<input
			type="text"
			id="planName"
			bind:value={newPlan.planName}
			class="editable"
			placeholder="name"
			required
		/>
	</div>
	<div class="input-container">
		<label for="startDate" style="margin-bottom: 10px;"
			>Start Date<span style="color: red;">*</span></label
		>
		<input type="date" id="startDate" bind:value={newPlan.startDate} class="editable" required />
	</div>
	<div class="input-container">
		<label for="endDate" style="margin-bottom: 10px;"
			>End Date<span style="color: red;">*</span></label
		>
		<input type="date" id="endDate" bind:value={newPlan.endDate} class="editable" required />
	</div>
	<div class="input-container">
		<label for="colour" style="margin-bottom: 10px;">Colour<span style="color: red;">*</span></label
		>
		<div class="color-box">
			<div class="custom-color-display" style="background-color: {newPlan.colour}"></div>
			<input type="color" id="colour" bind:value={newPlan.colour} class="hidden-input" />
		</div>
	</div>
	<div class="input-container">
		<div style="color: red;">*required field</div>
	</div>

	<div slot="button">
		<button class="modelCreateBtn" on:click={() => createNewPlan()}>CONFIRM</button>
	</div>
</Modal>

<CreateTaskModel bind:showCreateTask>
	<h2 slot="header" class="createTaskHeader">Create Task</h2>
	<div class="task-container">
		<div class="left-container">
			<div class="input-container2">
				<label for="taskID" style="margin-bottom: 10px;">Task ID</label>
				<span id="taskID">- Task not yet created -</span>
			</div>
			<div class="input-container2">
				<label for="taskName" style="margin-bottom: 10px;"
					>Task Name<span style="color: red;">*</span></label
				>
				<input
					type="text"
					id="taskName"
					bind:value={newTask.taskName}
					class="editable"
					placeholder="name"
					required
				/>
			</div>
			<div class="input-container2">
				<label for="taskDes" style="margin-bottom: 10px;">Task Description</label>
				<textarea
					id="taskDes"
					bind:value={newTask.taskDescription}
					class="editable"
					placeholder="description"
				/>
			</div>
			<div class="input-container2">
				<label for="plan-name" style="margin-bottom: 10px;">Plan Name</label>
				<select class="inputfields" id="plan-name" bind:value={newTask.planName}>
					<option value="" disabled>- select plan -</option>
					{#each distinctPlans as distinctPlan}
						<option class="options" value={distinctPlan.Plan_MVP_name}
							>{distinctPlan.Plan_MVP_name}</option
						>
					{/each}
				</select>
			</div>
			<div class="input-container2">
				<label for="taskState" style="margin-bottom: 10px;">Task State</label>
				<span id="taskState">{newTask.taskState}</span>
			</div>
			<div class="input-container2">
				<label for="taskCreator" style="margin-bottom: 10px;">Task Creator</label>
				<span id="taskCreator">{newTask.taskCreator}</span>
			</div>
			<div class="input-container2">
				<label for="createDate" style="margin-bottom: 10px;">Create Date (dd/mm/yyyy)</label>
				<span id="createDate">{newTask.taskDisplayDate}</span>
			</div>
			<div class="input-container2">
				<div style="color: red;">*required field</div>
			</div>
		</div>
		<div class="right-container">
			<div class="input-container2 notes-box">
				<label for="taskNotes">Notes</label>
				<textarea
					id="taskNotes"
					bind:value={newTask.taskNotes}
					placeholder="~ Task notes will be recorded here ~"
					readonly
				/>
			</div>
			<div class="input-container2 comments">
				<textarea bind:value={newTask.notesToAdd} placeholder="comments" />
			</div>
		</div>
	</div>
	<div slot="button">
		<button class="modelCreateBtn2" on:click={() => createNewTask()}>CONFIRM</button>
	</div>
</CreateTaskModel>

<EditTask bind:showEditTask>
	{#if appTasks[editTaskIndex]}
		<h2 class="createTaskHeader">{appTasks[editTaskIndex].Task_id}</h2>
		<div class="task-container">
			<div class="left-container">
				<div class="input-container2">
					<label for="taskID" style="margin-bottom: 10px;">Task ID</label>
					<span id="taskID">{appTasks[editTaskIndex].Task_id}</span>
				</div>
				<div class="input-container2">
					<label for="taskName" style="margin-bottom: 10px;">Task Name</label>
					<span id="taskName">{appTasks[editTaskIndex].Task_name}</span>
				</div>
				<div class="input-container2">
					<label for="taskDes" style="margin-bottom: 10px;">Task Description</label>
					<span id="taskDes">{appTasks[editTaskIndex].Task_description}</span>
				</div>
				<div class="input-container2">
					{#if newTask.taskState === 'open'}
						<label for="plan-name" style="margin-bottom: 10px;">Plan Name</label>
						<select class="inputfields" id="plan-name" bind:value={newTask.planName}>
							<option value="" disabled>- select plan -</option>
							<option value=""></option>
							{#each distinctPlans as distinctPlan}
								<option class="options" value={distinctPlan.Plan_MVP_name}
									>{distinctPlan.Plan_MVP_name}</option
								>
							{/each}
						</select>
						{:else}
						<label for="taskplan" style="margin-bottom: 10px;">Plan Name</label>
						<span id="taskplan">{newTask.planName}</span>
					{/if}
				</div>
				<div class="input-container2">
					<label for="taskState" style="margin-bottom: 10px;">Task State</label>
					<span id="taskState">{newTask.taskState}</span>
				</div>
				<div class="input-container2">
					<label for="taskCreator" style="margin-bottom: 10px;">Task Creator</label>
					<span id="taskCreator">{newTask.taskCreator}</span>
				</div>
				<div class="input-container2">
					<label for="taskOwner" style="margin-bottom: 10px;">Task Owner</label>
					<span id="taskOwner">{newTask.taskOwner}</span>
				</div>
				<div class="input-container2">
					<label for="createDate" style="margin-bottom: 10px;">Create Date (dd/mm/yyyy)</label>
					<span id="createDate">{newTask.taskDisplayDate}</span>
				</div>
			</div>
			<div class="right-container">
				<div class="input-container2 notes-box">
					<label for="taskNotes">Notes</label>
					<textarea
						id="taskNotes"
						bind:value={newTask.taskNotes}
						placeholder={newTask.taskNotes}
						readonly
					/>
				</div>
				<div class="input-container2 comments">
					<textarea bind:value={newTask.notesToAdd} placeholder="comments" />
				</div>
			</div>
		</div>
	{/if}
	<div slot="button1">
		<button class="modelCreateBtn2" on:click={() => saveChanges()}>SAVE CHANGES</button>
	</div>

	<div slot="button2">
		{#if newTask.taskState === 'open'}
			<button class="modelCreateBtn3" on:click={() => changeTaskStateTo('to do')}
				>RELEASE TASK</button
			>
		{/if}
		{#if newTask.taskState === 'to do'}
			<button class="modelCreateBtn3" on:click={() => changeTaskStateTo('doing')}
				>TAKE ON</button
			>
		{/if}
		{#if newTask.taskState === 'doing'} <!-- to include send email with on click i.e sendEmail()-->
			<button class="modelCreateBtn3" on:click={() => changeTaskStateTo('done')}
				>TO REVIEW</button
			>
		{/if}
		{#if newTask.taskState === 'done'} <!-- to include send email with on click i.e sendEmail()-->
			<button class="modelCreateBtn3" on:click={() => changeTaskStateTo('closed')}
				>CLOSE TASK</button
			>
		{/if}
	</div>
	
	<div slot="button3">
		{#if newTask.taskState === 'doing'}
			<button class="modelCreateBtn4" on:click={() => changeTaskStateTo('to do')}>FORFEIT TASK</button>
		{/if}
		{#if newTask.taskState === 'done'}
			<button class="modelCreateBtn4" on:click={() => changeTaskStateTo('doing')}>REJECT TASK</button>
		{/if}
	</div>
</EditTask>

<style>
	.container {
		margin-top: 45px;
		align-items: stretch;
		justify-content: center;
		margin-left: auto;
		margin-right: auto;
	}

	.header {
		display: flex;
		justify-content: center;
		text-align: center;
	}

	.head {
		flex-grow: 1;
	}

	.middle {
		flex-grow: 4;
	}

	.createPlan {
		flex-grow: 1;
		display: flex;
		justify-content: center;
	}

	.createPlanBtn {
		width: auto;
		appearance: button;
		background-color: black;
		color: white;
		border-width: 0;
		box-shadow:
			rgba(50, 50, 93, 0.1) 0 0 0 1px inset,
			rgba(50, 50, 93, 0.1) 0 2px 5px 0,
			rgba(0, 0, 0, 0.07) 0 1px 1px 0;
		box-sizing: border-box;
		font-size: 15px;
		height: 40px;
		margin: 15px 0 0;
		text-align: center;
		cursor: pointer;
		padding: 0 20px;
		transition: all 0.2s;
		float: right;
		line-height: 40px;
	}

	.modelCreateBtn {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 20px;
		border: none;
		color: white;
		background-color: black;
		width: 150px;
		height: 35px;
	}

	.modelCreateBtn2 {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 0px;
		border: none;
		color: white;
		background-color: black;
		width: 150px;
		height: 35px;
	}

	.modelCreateBtn3 {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 0px;
		border: none;
		color: white;
		background-color: #00a400;
		width: 150px;
		height: 35px;
	}

	.modelCreateBtn4 {
		cursor: pointer;
		padding: 5px 10px;
		margin-top: 0px;
		border: none;
		color: white;
		background-color: #d02929;
		width: 150px;
		height: 35px;
	}

	a {
		color: white;
		padding: 0 70px;
	}

	.greet {
		font-weight: bold; /* Optional: Make it bold */
	}

	.navCenter {
		display: flex;
		justify-content: space-evenly;
	}

	.links:hover,
	.edit:hover,
	.logout:hover {
		text-decoration: underline;
		color: lightgray;
	}

	.links {
		font-weight: bold; /* Optional: Make it bold */
		text-decoration: none;
		padding-left: 0;
		padding-right: 0;
		color: white;
	}

	.links:visited {
		color: white;
	}

	.links:hover {
		color: lightgray;
	}

	.input-container {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
	}

	.input-container label {
		width: 150px; /* Fixed width for labels to align them */
		text-align: left;
		margin-right: 10px;
	}

	.input-container input {
		flex: 1;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		width: 100%; /* Ensures inputs and selects take full width */
	}

	.createTaskHeader {
		padding: 0;
		margin-top: 5px;
		margin-bottom: 0;
	}

	.input-container2 {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
	}

	.input-container2 label {
		width: 80px; /* Fixed width for labels to align them */
		text-align: left;
		margin-right: 10px;
		font-weight: bold;
	}

	.input-container2 input,
	.input-container2 textarea,
	.input-container2 select {
		flex: 1;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		width: 100%; /* Ensures inputs and selects take full width */
	}

	.input-container2 textarea {
		height: 100px; /* Make the textarea larger */
		resize: none; /* Allow vertical resizing only */
	}

	.comments textarea {
		height: 60px;
	}

	.task-container {
		display: flex;
	}

	.left-container {
		width: 38%;
		padding-right: 10px;
	}

	.right-container {
		width: 62%;
		padding-left: 10px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.notes-box {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow-y: auto;
	}

	#taskNotes {
		border: none;
		background-color: #d8d8d8;
	}

	.editable {
		width: 100%;
	}

	.color-box {
		flex: 1;
		display: flex;
	}

	.custom-color-display {
		flex: 90;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	.hidden-input {
		flex: 1;
		cursor: pointer;
	}

	.kanban {
		display: flex;
		width: 100%;
		height: 70vh;
		box-sizing: border-box; /* Ensure padding and borders are included in the width */
	}

	.kanban-container {
		flex-grow: 1; /* Make each container take up equal space */
		padding: 10px; /* Optional: Add some padding inside the containers */
		text-align: center; /* Center the text horizontally */
		box-sizing: border-box; /* Include borders and padding in the width calculation */
		overflow-y: auto; /* In case content overflows */
		background-color: #d8d8d8;
		margin-left: 10px;
		margin-right: 10px;
		width: 20%;
	}

	/* Optional: Add a bit of spacing between columns */
	.kanban-container:not(:last-child) {
		margin-right: 10px;
	}
</style>
