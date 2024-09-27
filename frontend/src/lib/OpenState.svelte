<script>
    export let createTask;
</script>

<div>
    <div class="header">
        <h2 class="title-header">Open</h2>
        <button class="createTask-button" on:click|stopPropagation={createTask()}>CREATE TASK</button>
    </div>
</div>


<style>
    .header {
        display: flex;
        justify-content: space-between;
		margin-left: 10px;
		margin-right: 10px;
    }
	
    .createTask-button {
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
		text-align: center;
		cursor: pointer;
		padding: 0 20px;
		transition: all 0.2s;
		float: right;
		line-height: 40px;
	}
</style>