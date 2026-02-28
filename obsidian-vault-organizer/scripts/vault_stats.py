#!/usr/bin/env python3
"""
Obsidian Vault Statistics Generator

Analyzes an Obsidian vault and generates statistics:
- Total notes count
- Notes per folder
- Tag frequency
- Orphaned notes
- Recent activity
- Link statistics
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime, timedelta

class VaultAnalyzer:
    def __init__(self, vault_path):
        self.vault_path = Path(vault_path)
        self.notes = []
        self.tags = Counter()
        self.links = defaultdict(set)
        self.backlinks = defaultdict(set)

    def scan_vault(self):
        """Scan vault for all markdown files"""
        print(f"📂 Scanning vault: {self.vault_path}")

        for md_file in self.vault_path.rglob("*.md"):
            # Skip .obsidian config folder
            if ".obsidian" in str(md_file):
                continue

            self.notes.append(md_file)
            self._parse_note(md_file)

    def _parse_note(self, note_path):
        """Parse a single note for tags and links"""
        try:
            with open(note_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract tags
            tag_pattern = r'#([\w\-/]+)'
            for tag in re.findall(tag_pattern, content):
                self.tags[tag] += 1

            # Extract internal links
            link_pattern = r'\[\[([^\]]+)\]\]'
            for link in re.findall(link_pattern, content):
                # Handle aliases
                link_target = link.split('|')[0].split('#')[0]
                note_name = note_path.stem

                self.links[note_name].add(link_target)
                self.backlinks[link_target].add(note_name)

        except Exception as e:
            print(f"⚠️  Error parsing {note_path.name}: {e}")

    def get_folder_stats(self):
        """Get notes count per folder"""
        folder_counts = defaultdict(int)

        for note in self.notes:
            folder = note.parent.relative_to(self.vault_path)
            folder_counts[str(folder)] += 1

        return dict(sorted(folder_counts.items(), key=lambda x: x[1], reverse=True))

    def get_orphaned_notes(self):
        """Find notes with no incoming links"""
        orphans = []

        for note in self.notes:
            note_name = note.stem
            if note_name not in self.backlinks or len(self.backlinks[note_name]) == 0:
                orphans.append(note)

        return orphans

    def get_recent_notes(self, days=7):
        """Get notes modified in last N days"""
        cutoff = datetime.now() - timedelta(days=days)
        recent = []

        for note in self.notes:
            mtime = datetime.fromtimestamp(note.stat().st_mtime)
            if mtime > cutoff:
                recent.append((note, mtime))

        return sorted(recent, key=lambda x: x[1], reverse=True)

    def get_most_linked(self, n=10):
        """Get most-linked notes"""
        link_counts = [(note, len(links)) for note, links in self.backlinks.items()]
        return sorted(link_counts, key=lambda x: x[1], reverse=True)[:n]

    def generate_report(self):
        """Generate comprehensive vault statistics"""
        print("\n" + "="*60)
        print("📊 OBSIDIAN VAULT STATISTICS")
        print("="*60)

        # Basic stats
        print(f"\n📝 Total Notes: {len(self.notes)}")
        print(f"🔗 Total Links: {sum(len(links) for links in self.links.values())}")
        print(f"🏷️  Unique Tags: {len(self.tags)}")

        # Folder stats
        print("\n📁 Notes by Folder:")
        folder_stats = self.get_folder_stats()
        for folder, count in list(folder_stats.items())[:10]:
            print(f"   {folder}: {count} notes")

        # Tag stats
        print("\n🏷️  Top 10 Tags:")
        for tag, count in self.tags.most_common(10):
            print(f"   #{tag}: {count} occurrences")

        # Most linked notes
        print("\n🔗 Most Linked Notes:")
        for note, count in self.get_most_linked():
            print(f"   [[{note}]]: {count} incoming links")

        # Orphaned notes
        orphans = self.get_orphaned_notes()
        print(f"\n🔍 Orphaned Notes (no incoming links): {len(orphans)}")
        if orphans:
            for orphan in orphans[:10]:
                print(f"   - {orphan.relative_to(self.vault_path)}")
            if len(orphans) > 10:
                print(f"   ... and {len(orphans) - 10} more")

        # Recent activity
        print(f"\n📅 Recently Modified (last 7 days):")
        recent = self.get_recent_notes()
        if recent:
            for note, mtime in recent[:10]:
                date_str = mtime.strftime("%Y-%m-%d %H:%M")
                print(f"   [{date_str}] {note.relative_to(self.vault_path)}")
        else:
            print("   No recent modifications")

        # Vault health
        print("\n💚 Vault Health:")
        total = len(self.notes)
        if total > 0:
            orphan_pct = (len(orphans) / total) * 100
            linked_pct = 100 - orphan_pct
            avg_links = sum(len(links) for links in self.links.values()) / total

            print(f"   Linked notes: {linked_pct:.1f}%")
            print(f"   Orphaned notes: {orphan_pct:.1f}%")
            print(f"   Average links per note: {avg_links:.1f}")

        print("\n" + "="*60)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 vault_stats.py <vault-path>")
        print("\nCommon vault locations:")
        print("  ~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Brave Vault")
        print("  ~/Documents/Remote Obsidian/Remote Brave")
        sys.exit(1)

    vault_path = Path(sys.argv[1]).expanduser()

    if not vault_path.exists():
        print(f"❌ Vault not found: {vault_path}")
        sys.exit(1)

    analyzer = VaultAnalyzer(vault_path)
    analyzer.scan_vault()
    analyzer.generate_report()

if __name__ == '__main__':
    main()
