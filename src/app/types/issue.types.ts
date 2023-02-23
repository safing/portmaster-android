export class Section {
	title: string
	body:  string
}

export class IssueRequest {
	title:        string
	sections:     Array<Section>
}

export class TicketRequest {
	title:        string
	sections:     Array<Section>
	repoName:     string
	email:        string
}