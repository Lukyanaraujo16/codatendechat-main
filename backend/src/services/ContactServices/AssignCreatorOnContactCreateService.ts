import CreateContactAssignmentService from "./CreateContactAssignmentService";

interface Request {
  contactId: number;
  companyId: number;
  creatorUserId: number;
}

/** Atribui o criador como responsável ao criar contato. */
const AssignCreatorOnContactCreateService = async ({
  contactId,
  companyId,
  creatorUserId
}: Request): Promise<void> => {
  await CreateContactAssignmentService({
    contactId,
    userId: creatorUserId,
    companyId,
    assignedByUserId: creatorUserId
  });
};

export default AssignCreatorOnContactCreateService;
