/**
 * Email threading utility functions
 */

/**
 * Group emails into threads based on subject similarities and reply patterns
 * @param {Array} emails - Array of email objects
 * @returns {Array} Array of threaded email groups
 */
export function groupEmailsIntoThreads(emails) {
  if (!emails || emails.length === 0) return [];

  // Create a map for thread grouping
  const threadMap = new Map();
  const threads = [];

  // Helper function to normalize subject for threading
  const normalizeSubject = (subject) => {
    if (!subject) return '';
    
    // Remove common reply/forward prefixes and normalize case/space
    return subject
      .toLowerCase()
      .replace(/^(re:|fwd:|fw:)\s*/gi, '')
      .trim();
  };

  // Helper function to check if two subjects are similar enough for threading
  const areSubjectsThreaded = (subject1, subject2) => {
    const norm1 = normalizeSubject(subject1);
    const norm2 = normalizeSubject(subject2);
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // Partial match for very similar subjects (accounts for small typos)
    if (Math.abs(norm1.length - norm2.length) <= 3 && 
        (norm1.includes(norm2) || norm2.includes(norm1))) {
      return true;
    }
    
    return false;
  };

  // Helper function to check if emails are likely part of same conversation
  const areInSameConversation = (email1, email2) => {
    // Check subject similarity
    if (areSubjectsThreaded(email1.subject || '', email2.subject || '')) {
      // Check if participants overlap (sender/receiver)
      const participants1 = new Set([
        email1.fromUsername,
        ...(email1.toUsernames || [])
      ]);
      const participants2 = new Set([
        email2.fromUsername,
        ...(email2.toUsernames || [])
      ]);
      
      // If any participant is common, they're likely in the same conversation
      const hasCommonParticipant = [...participants1].some(p => participants2.has(p));
      return hasCommonParticipant;
    }
    
    return false;
  };

  // Group emails into threads
  for (const email of emails) {
    let threadAdded = false;
    
    // Try to add to existing thread
    for (const [threadId, thread] of threadMap) {
      if (areInSameConversation(thread[0], email)) {
        thread.push(email);
        threadAdded = true;
        break;
      }
    }
    
    // Create new thread if not added to existing
    if (!threadAdded) {
      const threadId = `thread_${threads.length}`;
      threadMap.set(threadId, [email]);
      threads.push({
        id: threadId,
        emails: [email],
        subject: email.subject,
        lastUpdated: email.timestamp,
        participantCount: new Set([
          email.fromUsername,
          ...(email.toUsernames || [])
        ]).size,
        messageCount: 1
      });
    }
  }

  // Update thread info and sort threads by last updated
  const finalThreads = Array.from(threadMap.values()).map((threadEmails, index) => {
    const sortedEmails = threadEmails.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    const lastEmail = sortedEmails[sortedEmails.length - 1];
    const allParticipants = new Set();
    sortedEmails.forEach(email => {
      allParticipants.add(email.fromUsername);
      (email.toUsernames || []).forEach(to => allParticipants.add(to));
    });

    return {
      id: `thread_${index}`,
      emails: sortedEmails,
      subject: sortedEmails[0].subject,
      lastUpdated: lastEmail.timestamp,
      participantCount: allParticipants.size,
      messageCount: sortedEmails.length,
      unreadCount: sortedEmails.filter(e => !e.isRead).length
    };
  });

  // Sort threads by most recently updated
  return finalThreads.sort((a, b) => 
    new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );
}

/**
 * Get thread summary text for display
 * @param {Object} thread - Thread object
 * @returns {string} Thread summary
 */
export function getThreadSummary(thread) {
  if (thread.messageCount === 1) {
    return thread.subject || '(No subject)';
  }
  
  const participantText = thread.participantCount === 1 
    ? '1 participant' 
    : `${thread.participantCount} participants`;
  
  return `${thread.subject || '(No subject)'} (${thread.messageCount} messages, ${participantText})`;
}

/**
 * Check if an email should be displayed as a thread
 * @param {Array} emails - Array of emails
 * @returns {boolean} Whether threading should be enabled
 */
export function shouldEnableThreading(emails) {
  if (!emails || emails.length === 0) return false;
  
  // Check if there are potential threads (emails with similar subjects)
  const subjects = emails.map(e => e.subject).filter(Boolean);
  if (subjects.length < 2) return false;
  
  const normalizedSubjects = subjects.map(s => 
    s.toLowerCase().replace(/^(re:|fwd:|fw:)\s*/gi, '').trim()
  );
  
  // Find duplicates (potential threads)
  const subjectCounts = normalizedSubjects.reduce((acc, subject) => {
    acc[subject] = (acc[subject] || 0) + 1;
    return acc;
  }, {});
  
  return Object.values(subjectCounts).some(count => count > 1);
}