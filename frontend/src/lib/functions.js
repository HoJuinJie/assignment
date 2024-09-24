export function getDateFromEpoch(epochTime) {
    const date = new Date(epochTime*1000);
    // Extract day, month, and year
    const day = date.getDate().toString().padStart(2, '0'); // pad with 0 if needed
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed, so add 1
    const year = date.getFullYear();
    // Format as DD/MM/YYYY
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate
}
