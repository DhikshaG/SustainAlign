output "droplet_ip" {
  description = "Public IP address of the application droplet"
  value       = digitalocean_droplet.app.ipv4_address
}

output "droplet_id" {
  description = "ID of the application droplet"
  value       = digitalocean_droplet.app.id
}

output "firewall_id" {
  description = "ID of the web firewall"
  value       = digitalocean_firewall.web.id
}
