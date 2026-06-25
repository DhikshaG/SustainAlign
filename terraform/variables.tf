variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (production/staging)"
  type        = string
  default     = "staging"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "droplet_size" {
  description = "Droplet plan size"
  type        = string
  default     = "s-2vcpu-4gb-intel"
}

variable "ssh_public_key" {
  description = "SSH public key content for deploy user"
  type        = string
}

variable "ssh_private_key" {
  description = "SSH private key content for remote provisioning"
  type        = string
  sensitive   = true
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
