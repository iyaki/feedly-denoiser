import whiteList from './data/whiteList.json' assert {type: 'json'}
import blackList from './data/blackList.json' assert {type: 'json'}
import blackestList from './data/blackestList.json' assert {type: 'json'}

const baseUrl = 'https://cloud.feedly.com'
const wordSeparatorRegex = /[\s\t\r\n"'‘’“”`\^\~_\.,;\:¡!¿?+\-\/*=\\\(\)\[\]{}|@#$%&<>]+/g
const processedTitles = []

let continuation = null
let unreadEntries = []
while (true) {
	const streamsParams = (new URLSearchParams({
		streamId: process.env.COLLECTION,
		count: 250,
		ranked: 'oldest',
		continuation: continuation,
		unreadOnly: true
	})).toString()

	const response = await fetch(
		`${baseUrl}/v3/streams/contents?${streamsParams}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${process.env.CLIENT_SECRET}`
			}
		}
	)

	if (response.status === 401) {
		console.warn(`

------------------------------------------------------------------
|                           IMPORTANTE                           |
------------------------------------------------------------------
| Debe actualizarse el token de Feedly. Dirijirse a:             |
| https://feedly.com/v3/auth/dev                                 |
|                                                                |
| Una vez que obtenga el token reemplazelo en el archivo .env    |
| o en la variable de entorno: CLIENT_SECRET                     |
------------------------------------------------------------------

`)
		break
	}

	const responseData = JSON.parse(
		normalizeString(
			await response.text()
		)
	)

	if (response.status !== 200) {
		console.error('Status:', response.status)
		console.error('Response:', responseData)
		break;
	}

	unreadEntries = unreadEntries.concat(responseData.items)

	if (typeof responseData.continuation === 'undefined') {
		break
	}
	continuation = responseData.continuation

}

function normalizeString(string) {
	return string.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

const entriesToMarkAsRead = unreadEntries.filter(filterEntry)

function filterEntry(entry) {
	return (
		filterDuplicate(entry) ||
		filterTitle(entry) ||
		filterContent(entry)
	)
}

function filterDuplicate(entry) {
	const isDuplicate = processedTitles.includes(entry.title)

	processedTitles.push(entry.title)

	return isDuplicate
}

function filterTitle(entry) {
	const title = entry.title.toLowerCase().trim()

	console.log(title, filterStringTokens(title, blackestList))

	return (
		filterStringTokens(title, blackestList).length > 0 || // Title in blackestList
		( // Title in blackList but not in whiteList
			filterStringTokens(title, blackList).length > 0 &&
			filterStringTokens(title, whiteList).length === 0
		)
	)
}

function filterContent(entry) {
	const content = ((entry.content?.content || '') + ' ' + (entry.summary?.content || ''))
		.trim()
		.toLowerCase()

	return (
		content === '' || // No content
		filterStringTokens(content, blackestList).length > 0 || // Content in blackestList
		( // Content in blackList but not in whiteList
			filterStringTokens(content, blackList).length > 0 &&
			filterStringTokens(content, whiteList).length === 0
		)
	)
}

function filterStringTokens(string, checkTokens) {
	const tokens = string.split(wordSeparatorRegex)

	let result = []
	for (const checkToken of checkTokens) {
		if (wordSeparatorRegex.test(checkToken)) {
			result.push(string.includes(checkToken))
		} else {
			result.push(tokens.includes(checkToken))
		}
	}

	return result
}

await fetch(
	`${baseUrl}/v3/markers`,
	{
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${process.env.CLIENT_SECRET}`
		},
		body: JSON.stringify({
			action: 'markAsRead',
			type: 'entries',
			entryIds: entriesToMarkAsRead.map(entry => entry.id)
		})
	}
)

console.log(entriesToMarkAsRead.map(entry => `${entry.title} - ${entry.canonicalUrl} `))
console.log('----------------------------------------------------------------------------------')
console.log(`${entriesToMarkAsRead.length} entries marked as read`)
