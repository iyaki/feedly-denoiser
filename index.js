import whiteList from './data/whiteList.json' assert {type: 'json'}
import blackList from './data/blackList.json' assert {type: 'json'}

const baseUrl = 'https://cloud.feedly.com'
const wordSeparatorRegex = /[\s.,;:!?\-]+/g

const streamsParams = (new URLSearchParams({
	streamId: process.env.COLLECTION,
	count: 250,
	unreadOnly: true
})).toString()
const unreadEntries = await (await fetch(
	`${baseUrl}/v3/streams/contents?${streamsParams}`,
	{
		method: 'GET',
		headers: {
			Authorization: `Bearer ${process.env.CLIENT_SECRET}`
		}
	}
)).json()

const entriesToMarkAsRead = unreadEntries.items.filter(filterEntry)

function filterEntry(entry) {
	return filterTitle(entry) || filterContent(entry)
}

function filterTitle(entry) {
	const title = entry.title.toLowerCase()
	return filterStringTokens(title, blackList).length > 0 &&
		filterStringTokens(title, whiteList).length === 0
}

function filterContent(entry) {
	const content = ((entry.content?.content || '') + ' ' + (entry.summary?.content || ''))
		.trim()
		.toLowerCase()

	return filterStringTokens(content, blackList).length > 0 &&
		filterStringTokens(content, whiteList).length === 0
}

function filterStringTokens(string, checkTokens) {
	const tokens = string.split(wordSeparatorRegex)

	return checkTokens.filter(
		checkToken => (
			wordSeparatorRegex.test(checkToken)
			? string.includes(checkToken)
			: tokens.includes(checkToken)
		)
	)
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

console.log(entriesToMarkAsRead.map(entry => ({title: entry.title, content: entry.content?.content || entry.summary?.content})))
console.log('----------------------------------------------------------------------------------')
console.log(`${entriesToMarkAsRead.length} entries marked as read`)
